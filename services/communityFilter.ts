import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Community, Item } from "./supabase_api";

// The value of the community filter when no single community is picked.
export const ALL_COMMUNITIES = "all";

// Items have one community_id today. If an item can belong to several
// communities, this is the only check that needs to change.
export function itemInCommunity(item: Pick<Item, "community_id">, communityId: string): boolean {
  return item.community_id === communityId;
}

// get_items is already limited by RLS to the user's own items and items in
// communities they are an active member of, so "All" keeps every item.
export function filterItemsByCommunity<T extends Pick<Item, "community_id">>(
  items: T[],
  communityId: string
): T[] {
  if (communityId === ALL_COMMUNITIES) return items;
  return items.filter((item) => itemInCommunity(item, communityId));
}

// A saved community the user is no longer in falls back to "All".
export function resolveCommunityFilter(
  saved: string | null | undefined,
  myCommunities: Pick<Community, "id">[]
): string {
  if (!saved || saved === ALL_COMMUNITIES) return ALL_COMMUNITIES;
  return myCommunities.some((c) => c.id === saved) ? saved : ALL_COMMUNITIES;
}

const storageKey = (userId: string) => `homeCommunityFilter:${userId}`;

export async function loadCommunityFilter(userId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

export async function saveCommunityFilter(userId: string, communityId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), communityId);
  } catch {
  }
}
