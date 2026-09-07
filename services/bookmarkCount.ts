import AsyncStorage from "@react-native-async-storage/async-storage";

// bookmark counts are per-item, stored locally on this device.
// not tied to a specific user - the count is a property of the item.
function keyFor(itemId: number): string {
  return `bookmark-count:${itemId}`;
}

export async function getBookmarkCount(itemId: number): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(keyFor(itemId));
    return stored ? parseInt(stored, 10) : 0;
  } catch (err) {
    console.error(`Error loading bookmark count for item ${itemId}:`, err);
    return 0;
  }
}

// call this right after toggling a bookmark - pass whether it WAS bookmarked
// before the toggle, and this returns the new count after saving it
export async function updateBookmarkCount(
  itemId: number,
  wasBookmarked: boolean,
  currentCount: number
): Promise<number> {
  const newCount = wasBookmarked
    ? Math.max(0, currentCount - 1)
    : currentCount + 1;

  try {
    await AsyncStorage.setItem(keyFor(itemId), String(newCount));
  } catch (err) {
    console.error(`Error saving bookmark count for item ${itemId}:`, err);
  }

  return newCount;
}