import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Community, Item } from "./supabase_api";

// The value of the community filter when no single community is picked.
export const ALL_COMMUNITIES = "all";

// An item can be in several communities. Its list comes from
// items.getCommunityIds; undefined means it hasn't loaded or the lookup failed.
export function itemInCommunity(communityIds: string[] | undefined, communityId: string): boolean {
  return communityIds?.includes(communityId) ?? false;
}

// get_items is already limited by RLS to the user's own items and items in
// communities they are an active member of, so "All" keeps every item, even
// ones whose communities haven't loaded. A single community hides those.
export function filterItemsByCommunity<T extends Pick<Item, "id">>(
  items: T[],
  communityId: string,
  communityIdsByItem: Record<string, string[]>
): T[] {
  if (communityId === ALL_COMMUNITIES) return items;
  return items.filter((item) => itemInCommunity(communityIdsByItem[item.id], communityId));
}

// The first of the item's communities the user is in, plus "+N" for the rest
// of the user's communities it is in. Undefined when there are none.
export function communityLabel(
  communityIds: string[] | undefined,
  communityNames: Record<string, string>
): string | undefined {
  const mine = (communityIds ?? []).filter((id) => communityNames[id] !== undefined);
  if (mine.length === 0) return undefined;
  const first = communityNames[mine[0]];
  return mine.length > 1 ? `${first} +${mine.length - 1}` : first;
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
