import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useItems } from "./ItemsContext";
import {
  borrowing_history,
  borrowing_requests,
  type BorrowingHistory,
  type BorrowingRequest,
} from "../services/supabase_api";
import { replaceById, unwrap, useUserScopedLoad, type LoadState, type Take } from "./contextUtils";

export type BorrowingValue = LoadState & {
  myRequests: BorrowingRequest[];
  incomingRequests: BorrowingRequest[];
  borrowingHistory: BorrowingHistory[];
  requestToBorrow: (itemId: string) => Promise<BorrowingRequest>;
  cancelRequest: (requestId: string) => Promise<void>;
  approveRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  markReturned: (requestId: string) => Promise<void>;
};

const BorrowingContext = createContext<BorrowingValue | null>(null);

// Must be rendered inside <ItemsProvider>, since approving and returning also refresh items.
export function BorrowingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { refresh: refreshItems } = useItems();

  // Read after an await, so a sign-out during the call is seen.
  const userIdRef = useRef(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const [myRequests, setMyRequests] = useState<BorrowingRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<BorrowingRequest[]>([]);
  const [borrowingHistory, setBorrowingHistory] = useState<BorrowingHistory[]>([]);

  const fetchAll = useCallback(async () => {
    const [mine, incoming, history] = await Promise.all([
      borrowing_requests.getMine(),
      borrowing_requests.getIncoming(),
      borrowing_history.getMine(),
    ]);
    return (take: Take) => {
      take(mine, (v) => setMyRequests(v ?? []));
      take(incoming, (v) => setIncomingRequests(v ?? []));
      take(history, (v) => setBorrowingHistory(v ?? []));
    };
  }, []);

  const reset = useCallback(() => {
    setMyRequests([]);
    setIncomingRequests([]);
    setBorrowingHistory([]);
  }, []);

  const { loading, error, refresh } = useUserScopedLoad(
    user?.id,
    fetchAll,
    reset,
    "Could not load your borrowing requests"
  );

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
  // so reload borrowing data and items rather than patching several lists by hand.
  // Skip the reload if the user signed out while the call was in flight.
  const refreshAfterChange = useCallback(async () => {
    if (!userIdRef.current) return;
    await Promise.all([refresh(), refreshItems()]);
  }, [refresh, refreshItems]);

  const approveRequest = useCallback(
    async (requestId: string) => {
      unwrap(await borrowing_requests.approve(requestId));
      await refreshAfterChange();
    },
    [refreshAfterChange]
  );

  const markReturned = useCallback(
    async (requestId: string) => {
      unwrap(await borrowing_history.markReturned(requestId));
      await refreshAfterChange();
    },
    [refreshAfterChange]
  );

  const value: BorrowingValue = {
    myRequests,
    incomingRequests,
    borrowingHistory,
    loading,
    error,
    refresh,
    requestToBorrow,
    cancelRequest,
    approveRequest,
    declineRequest,
    markReturned,
  };

  return <BorrowingContext.Provider value={value}>{children}</BorrowingContext.Provider>;
}

export function useBorrowing() {
  const ctx = useContext(BorrowingContext);
  if (!ctx) throw new Error("useBorrowing must be used inside <BorrowingProvider>");
  return ctx;
}
