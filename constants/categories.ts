// The one list of item categories, shared by Home, Search and List.
export const ITEM_CATEGORIES = [
  "Tools",
  "Outdoor",
  "Home & Garden",
  "Kitchen",
  "Books",
  "Other",
] as const;

export type ItemCategory = (typeof ITEM_CATEGORIES)[number];

// The filter value that matches every category. Home labels it "Popular".
export const ALL_CATEGORIES = "All";

export const CATEGORY_FILTERS = [ALL_CATEGORIES, ...ITEM_CATEGORIES] as const;

// Any category not in the list (old values, typos, test data) counts as Other.
export function categoryOf(raw: string | null | undefined): ItemCategory {
  const value = (raw ?? "").trim().toLowerCase();
  return ITEM_CATEGORIES.find((c) => c.toLowerCase() === value) ?? "Other";
}

export function matchesCategory(
  item: { category: string | null },
  filter: string
): boolean {
  return filter === ALL_CATEGORIES || categoryOf(item.category) === filter;
}
