import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "../context/AuthContext";
import { items as itemsApi } from "../services/supabase_service";

// get_items doesn't return an item's communities yet, so each item needs its
// own items.getCommunityIds request. Results are cached here, outside React,
// so moving between Home and Discover doesn't refetch them.

// Lookups allowed in flight at once, across every screen using the hook.
export const MAX_CONCURRENT_LOOKUPS = 6;

// null means the lookup failed, so the item's communities are unknown.
const cache = new Map<string, string[] | null>();
// The token of the current lookup for each item. A lookup whose token was
// replaced (by a newer refresh) or removed (by sign-out) drops its result.
const pending = new Map<string, object>();
const waiting: { run: () => void; release: () => void }[] = [];
let running = 0;
// Bumped by a full clear, which starts a fresh set of slots so lookups that
// never finish can't hold them for the next user.
let slotGeneration = 0;
// The user the cache belongs to. undefined until a screen first uses it.
let cacheUserId: string | null | undefined;

// A new object on every change, so React knows to re-read the cache.
let store = { cache };
const listeners = new Set<() => void>();

function emit() {
  store = { cache };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getStore = () => store;

function limited(task: () => Promise<void>): Promise<void> {
  return new Promise((resolve) => {
    const generation = slotGeneration;
    const run = () => {
      running++;
      void task().finally(() => {
        resolve();
        if (generation !== slotGeneration) return;
        running--;
        waiting.shift()?.run();
      });
    };
    if (running < MAX_CONCURRENT_LOOKUPS) run();
    else waiting.push({ run, release: resolve });
  });
}

// force looks the item up again even when it is cached or already loading.
function lookup(itemId: string, force = false): Promise<void> {
  if (!force && (cache.has(itemId) || pending.has(itemId))) return Promise.resolve();
  const token = {};
  pending.set(itemId, token);

  return limited(async () => {
    // Cleared while waiting for a free slot.
    if (pending.get(itemId) !== token) return;

    let communityIds: string[] | null = null;
    try {
      const { data, error } = await itemsApi.getCommunityIds(itemId);
      if (!error) communityIds = data ?? [];
    } catch {
      // Treated as unknown, like an error response.
    }

    if (pending.get(itemId) !== token) return;
    pending.delete(itemId);
    // A failed refresh keeps the list the item already had.
    if (communityIds === null && cache.has(itemId)) return;
    cache.set(itemId, communityIds);
    emit();
  });
}

// Forgets every item and drops lookups still running.
export function clearItemCommunities() {
  cache.clear();
  pending.clear();
  slotGeneration++;
  running = 0;
  waiting.splice(0).forEach((w) => w.release());
  emit();
}

// The community ids of each item, keyed by item id. Items still loading, or
// whose lookup failed, are left out.
export function useItemCommunities(itemIds: string[]) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const current = useSyncExternalStore(subscribe, getStore);

  // A new array each render; ids only changes when the ids themselves do.
  const key = itemIds.join(",");
  const ids = useMemo(() => (key ? key.split(",") : []), [key]);

  // One account's cache must not show for the next, so signing out or
  // switching users empties it.
  useEffect(() => {
    if (cacheUserId !== undefined && cacheUserId !== userId) clearItemCommunities();
    cacheUserId = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    ids.forEach((id) => void lookup(id));
  }, [ids, userId]);

  const { communityIdsByItem, loading } = useMemo(() => {
    const byItem: Record<string, string[]> = {};
    let missing = false;
    ids.forEach((id) => {
      const communityIds = current.cache.get(id);
      if (communityIds) byItem[id] = communityIds;
      if (!current.cache.has(id)) missing = true;
    });
    return { communityIdsByItem: byItem, loading: !!userId && missing };
  }, [ids, userId, current]);

  // Looks the items up again. Their current lists stay until the new ones
  // arrive, so a picked community doesn't empty out while refreshing.
  const refresh = useCallback(async () => {
    if (userId) await Promise.all(ids.map((id) => lookup(id, true)));
  }, [ids, userId]);

  return { communityIdsByItem, loading, refresh };
}
