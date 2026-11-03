import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  communities,
  community_members,
  type Community,
  type CreateCommunityRequest,
} from "../services/supabase_api";
import { unwrap, useUserScopedLoad, type LoadState, type Take } from "./contextUtils";

export type CommunityValue = LoadState & {
  myCommunities: Community[];
  createCommunity: (data: CreateCommunityRequest) => Promise<Community>;
  requestToJoin: (communityId: string) => Promise<void>;
  leaveCommunity: (communityId: string) => Promise<void>;
};

const CommunityContext = createContext<CommunityValue | null>(null);

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [myCommunities, setMyCommunities] = useState<Community[]>([]);

  const fetchAll = useCallback(async () => {
    const c = await communities.getMine();
    return (take: Take) => take(c, (v) => setMyCommunities(v ?? []));
  }, []);

  const reset = useCallback(() => setMyCommunities([]), []);

  const { loading, error, refresh } = useUserScopedLoad(
    user?.id,
    fetchAll,
    reset,
    "Could not load your communities"
  );

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

  const value: CommunityValue = {
    myCommunities,
    loading,
    error,
    refresh,
    createCommunity,
    requestToJoin,
    leaveCommunity,
  };

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunities() {
  const ctx = useContext(CommunityContext);
  if (!ctx) throw new Error("useCommunities must be used inside <CommunityProvider>");
  return ctx;
}
