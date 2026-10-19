import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  borrowing_history,
  borrowing_requests,
  communities,
  community_members,
  items,
  profiles,
  type BorrowingHistory,
  type BorrowingRequest,
  type Community,
  type CreateCommunityRequest,
  type CreateItemRequest,
  type Item,
  type Profile,
  type UpdateItemRequest,
  type UpdateProfileRequest,
} from "../services/supabase_api";

type RpcResult<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(result: RpcResult<T>): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

function replaceById<T extends { id: string }>(list: T[], row: T): T[] {
  return list.map((r) => (r.id === row.id ? row : r));
}

type DatabaseValue = {
  profile: Profile | null;
  myCommunities: Community[];
  myItems: Item[];
  myRequests: BorrowingRequest[];
  incomingRequests: BorrowingRequest[];
  borrowingHistory: BorrowingHistory[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  profilesById: Record<string, Profile>;
  getProfile: (id: string) => Promise<Profile | null>;

  updateProfile: (data: UpdateProfileRequest) => Promise<Profile>;

  createCommunity: (data: CreateCommunityRequest) => Promise<Community>;
  requestToJoin: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;

  createItem: (data: CreateItemRequest) => Promise<Item>;
  updateItem: (id: string, data: UpdateItemRequest) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;

  requestToBorrow: (itemId: string) => Promise<BorrowingRequest>;
  cancelRequest: (requestId: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  markReturned: (requestId: string) => Promise<void>;
};

const DatabaseContext = createContext<DatabaseValue | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myRequests, setMyRequests] = useState<BorrowingRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BorrowingRequest[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const [profilesById, setProfilesById] = useState<Record<string, Profile>>({});
  const profileCache = useRef<Record<string, Profile>>({});
  const inflightProfiles = useRef(new Map<string, Promise<Profile | null>>());

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const [p, c, i, mine, incoming, history] = await Promise.all([
        profiles.getCurrent(),
        communities.getMine(),
        items.getMine(),
        borrowing_requests.getMine(),
        borrowing_requests.getIncoming(),
        borrowing_history.getMine(),
      ]);
      if (id !== requestId.current) return;

      // Apply each result on its own, so one failed call doesn't skip the rest.
      // A list that failed keeps its previous value.
      const failures: string[] = [];
      const take = <T,>(result: RpcResult<T>, set: (value: T | null) => void) => {
        if (result.error) failures.push(result.error.message);
        else set(result.data);
      };
      take(p, setProfile);
      take(c, (v) => setMyCommunities(v ?? []));
      take(i, (v) => setMyItems(v ?? []));
      take(mine, (v) => setMyRequests(v ?? []));
      take(incoming, (v) => setIncomingRequests(v ?? []));
      take(history, (v) => setBorrowingHistory(v ?? []));
      if (failures.length > 0) setError(failures[0]);
    } catch (e) {
      // Only reached if a call itself throws (for example, no network).
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Could not load your data");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      // Signed out: ignore any load still in flight and drop the old user's data.
      requestId.current++;
      profileCache.current = {};
      inflightProfiles.current.clear();
      /* eslint-disable react-hooks/set-state-in-effect */
      setProfile(null);
      setProfilesById({});
      setMyCommunities([]);
      setMyItems([]);
      setMyRequests([]);
      setIncomingRequests([]);
      setBorrowingHistory([]);
      setLoading(false);
      setError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    void load();
  }, [userId, load]);

  const getProfile = useCallback(async (id: string): Promise<Profile | null> => {
    const cached = profileCache.current[id];
    if (cached) return cached;
    const pending = inflightProfiles.current.get(id);
    if (pending) return pending;

    const request = Promise.resolve(profiles.getById(id)).then((res) => {
      inflightProfiles.current.delete(id);
      // A missing profile can come back as a row of nulls, so check the id too.
      if (res.error || !res.data?.id) return null;
      const found = res.data as Profile;
      profileCache.current[id] = found;
      setProfilesById((prev) => ({ ...prev, [id]: found }));
      return found;
    });
    inflightProfiles.current.set(id, request);
    return request;
  }, []);

  // Profile

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    const updated = unwrap(await profiles.update(data));
    setProfile(updated);
    return updated;
  }, []);

  // Communities

  const createCommunity = useCallback(async (data: CreateCommunityRequest) => {
    const created = unwrap(await communities.create(data));
    setMyCommunities((prev) => [...prev, created]);
    return created;
  }, []);

  const requestToJoin = useCallback(async (communityId: string) => {
    // Joining is pending until an admin approves, so myCommunities doesn't change yet.
    unwrap(await community_members.requestToJoin(communityId));
  }, []);

  const leaveCommunity = useCallback(async (communityId: string) => {
    unwrap(await community_members.leave(communityId));
    setMyCommunities((prev) => prev.filter((c) => c.id !== communityId));
  }, []);

  // Items

  const createItem = useCallback(async (data: CreateItemRequest) => {
    const created = unwrap(await items.create(data));
    setMyItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateItem = useCallback(async (id: string, data: UpdateItemRequest) => {
    const updated = unwrap(await items.update(id, data));
    setMyItems((prev) => replaceById(prev, updated));
    return updated;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    unwrap(await items.delete(id));
    setMyItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Borrowing

  const requestToBorrow = useCallback(async (itemId: string) => {
    const created = unwrap(await borrowing_requests.create(itemId));
    setMyRequests((prev) => [created, ...prev]);
    return created;
  }, []);

  const cancelRequest = useCallback(async (requestId: string) => {
    const updated = unwrap(await borrowing_requests.cancel(requestId));
    setMyRequests((prev) => replaceById(prev, updated));
  }, []);

  const declineRequest = useCallback(async (requestId: string) => {
    const updated = unwrap(await borrowing_requests.decline(requestId));
    setIncomingRequests((prev) => replaceById(prev, updated));
  }, []);

  // Approving and returning also change item status and history on the server,
  // so reload everything rather than patching several lists by hand.
  const approveRequest = useCallback(
    async (requestId: string) => {
      unwrap(await borrowing_requests.approve(requestId));
      await load();
    },
    [load]
  );

  const markReturned = useCallback(
    async (requestId: string) => {
      unwrap(await borrowing_history.markReturned(requestId));
      await load();
    },
    [load]
  );

  const value: DatabaseValue = {
    profile,
    myCommunities,
    myItems,
    myRequests,
    incomingRequests,
    borrowingHistory,
    loading,
    error,
    refresh: load,
    profilesById,
    getProfile,
    updateProfile,
    createCommunity,
    requestToJoin,
    leaveCommunity,
    createItem,
    updateItem,
    deleteItem,
    requestToBorrow,
    cancelRequest,
    approveRequest,
    declineRequest,
    markReturned,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be used inside <DatabaseProvider>");
  return ctx;
}
