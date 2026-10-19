import AsyncStorage from "@react-native-async-storage/async-storage";

// chatKey is "community:<id>" or "dm:<otherUserId>".
// Value is the created_at of the newest message the user has seen there.
export type LastReadMap = Record<string, string>;

const storageKey = (userId: string) => `lastRead:${userId}`;

export async function loadLastRead(userId: string): Promise<LastReadMap> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as LastReadMap) : {};
  } catch {
    return {};
  }
}

export async function saveLastRead(userId: string, map: LastReadMap): Promise<void> {
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(map));
  } catch {
  }
}

export function isUnread(
  lastRead: LastReadMap,
  chatKey: string,
  latest: { created_at: string; sender_id: string } | null,
  myId: string
): boolean {
  if (!latest || latest.sender_id === myId) return false;
  const seen = lastRead[chatKey];
  return !seen || Date.parse(latest.created_at) > Date.parse(seen);
}