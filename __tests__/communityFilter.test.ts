import {
  ALL_COMMUNITIES,
  communityLabel,
  filterItemsByCommunity,
  itemInCommunity,
} from "../services/communityFilter";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("itemInCommunity", () => {
  it("is true for any of the item's communities", () => {
    expect(itemInCommunity(["c1", "c2", "c3"], "c1")).toBe(true);
    expect(itemInCommunity(["c1", "c2", "c3"], "c3")).toBe(true);
  });

  it("is false for a community the item isn't in", () => {
    expect(itemInCommunity(["c1", "c2"], "c9")).toBe(false);
    expect(itemInCommunity([], "c1")).toBe(false);
  });

  it("is false while the item's communities are unknown", () => {
    expect(itemInCommunity(undefined, "c1")).toBe(false);
  });
});

describe("filterItemsByCommunity", () => {
  const items = [{ id: "i1" }, { id: "i2" }, { id: "i3" }];
  const byItem = { i1: ["c1", "c2"], i2: ["c2"] }; // i3 hasn't loaded

  it("keeps every item under All, including ones that haven't loaded", () => {
    expect(filterItemsByCommunity(items, ALL_COMMUNITIES, byItem)).toEqual(items);
    expect(filterItemsByCommunity(items, ALL_COMMUNITIES, {})).toEqual(items);
  });

  it("keeps items in several communities under each of them", () => {
    expect(filterItemsByCommunity(items, "c1", byItem)).toEqual([{ id: "i1" }]);
    expect(filterItemsByCommunity(items, "c2", byItem)).toEqual([{ id: "i1" }, { id: "i2" }]);
  });

  it("hides items that haven't loaded under a single community", () => {
    expect(filterItemsByCommunity(items, "c1", {})).toEqual([]);
  });
});

describe("communityLabel", () => {
  const names = { c1: "Maple Street", c2: "Oak Hall", c3: "Pine Ridge" };

  it("names the item's only community", () => {
    expect(communityLabel(["c2"], names)).toBe("Oak Hall");
  });

  it("adds +N for the rest of the user's communities", () => {
    expect(communityLabel(["c1", "c2"], names)).toBe("Maple Street +1");
    expect(communityLabel(["c3", "c1", "c2"], names)).toBe("Pine Ridge +2");
  });

  it("skips and doesn't count communities the user isn't in", () => {
    expect(communityLabel(["c9", "c2"], names)).toBe("Oak Hall");
    expect(communityLabel(["c9", "c2", "c8", "c1"], names)).toBe("Oak Hall +1");
  });

  it("is undefined when none of the item's communities are the user's, or they're unknown", () => {
    expect(communityLabel(["c9"], names)).toBeUndefined();
    expect(communityLabel([], names)).toBeUndefined();
    expect(communityLabel(undefined, names)).toBeUndefined();
  });
});
