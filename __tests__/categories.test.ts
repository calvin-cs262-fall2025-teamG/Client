import {
  ALL_CATEGORIES,
  CATEGORY_FILTERS,
  ITEM_CATEGORIES,
  categoryOf,
  matchesCategory,
} from "../constants/categories";

describe("categoryOf", () => {
  it("keeps categories from the list", () => {
    for (const c of ITEM_CATEGORIES) expect(categoryOf(c)).toBe(c);
  });

  it("ignores case and surrounding spaces", () => {
    expect(categoryOf("  home & garden ")).toBe("Home & Garden");
  });

  it("groups anything else under Other", () => {
    expect(categoryOf("Test")).toBe("Other");
    expect(categoryOf("Electronics")).toBe("Other");
    expect(categoryOf("")).toBe("Other");
    expect(categoryOf(null)).toBe("Other");
  });
});

describe("matchesCategory", () => {
  it("matches everything for All", () => {
    expect(matchesCategory({ category: "Test" }, ALL_CATEGORIES)).toBe(true);
  });

  it("puts unknown categories in Other only", () => {
    expect(matchesCategory({ category: "Test" }, "Other")).toBe(true);
    expect(matchesCategory({ category: "Test" }, "Tools")).toBe(false);
  });
});

it("starts the filter list with All", () => {
  expect(CATEGORY_FILTERS).toEqual([ALL_CATEGORIES, ...ITEM_CATEGORIES]);
});
