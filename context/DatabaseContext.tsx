import React, { useCallback } from "react";
import { ProfileProvider, useProfile, type ProfileValue } from "./ProfileContext";
import { CommunityProvider, useCommunities, type CommunityValue } from "./CommunityContext";
import { ItemsProvider, useItems, type ItemsValue } from "./ItemsContext";
import { BorrowingProvider, useBorrowing, type BorrowingValue } from "./BorrowingContext";
import type { LoadState } from "./contextUtils";

type DatabaseValue = LoadState &
  Omit<ProfileValue, keyof LoadState> &
  Omit<CommunityValue, keyof LoadState> &
  Omit<ItemsValue, keyof LoadState> &
  Omit<BorrowingValue, keyof LoadState>;

// BorrowingProvider sits inside ItemsProvider because it refreshes items.
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <CommunityProvider>
        <ItemsProvider>
          <BorrowingProvider>{children}</BorrowingProvider>
        </ItemsProvider>
      </CommunityProvider>
    </ProfileProvider>
  );
}

/**
 * @deprecated Use useProfile, useCommunities, useItems, or useBorrowing instead.
 * Combines all four contexts so existing screens keep working.
 */
export function useDatabase(): DatabaseValue {
  const profile = useProfile();
  const community = useCommunities();
  const itemsCtx = useItems();
  const borrowing = useBorrowing();
  const parts = [profile, community, itemsCtx, borrowing];

  const refreshProfile = profile.refresh;
  const refreshCommunities = community.refresh;
  const refreshItems = itemsCtx.refresh;
  const refreshBorrowing = borrowing.refresh;
  const refresh = useCallback(async () => {
    await Promise.all([refreshProfile(), refreshCommunities(), refreshItems(), refreshBorrowing()]);
  }, [refreshProfile, refreshCommunities, refreshItems, refreshBorrowing]);

  return {
    ...profile,
    ...community,
    ...itemsCtx,
    ...borrowing,
    loading: parts.some((p) => p.loading),
    error: parts.find((p) => p.error)?.error ?? null,
    refresh,
  };
}
