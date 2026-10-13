import AsyncStorage from "@react-native-async-storage/async-storage";
import { getBookmarkCount, updateBookmarkCount } from "../services/bookmarkCount";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("getBookmarkCount", () => {
  it("returns 0 when nothing is stored", async () => {
    await expect(getBookmarkCount(42)).resolves.toBe(0);
  });

  it("returns the stored count for that item", async () => {
    await AsyncStorage.setItem("bookmark-count:42", "5");
    await AsyncStorage.setItem("bookmark-count:43", "9");

    await expect(getBookmarkCount(42)).resolves.toBe(5);
  });

  it("returns 0 when storage throws", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("disk error"));

    await expect(getBookmarkCount(42)).resolves.toBe(0);
  });
});

describe("updateBookmarkCount", () => {
  it("increments and saves when the item wasn't bookmarked", async () => {
    await expect(updateBookmarkCount(42, false, 2)).resolves.toBe(3);
    await expect(getBookmarkCount(42)).resolves.toBe(3);
  });

  it("decrements and saves when the item was bookmarked", async () => {
    await expect(updateBookmarkCount(42, true, 2)).resolves.toBe(1);
    await expect(getBookmarkCount(42)).resolves.toBe(1);
  });

  it("never goes below 0", async () => {
    await expect(updateBookmarkCount(42, true, 0)).resolves.toBe(0);
  });

  it("still returns the new count when saving fails", async () => {
    jest.spyOn(AsyncStorage, "setItem").mockRejectedValueOnce(new Error("disk full"));

    await expect(updateBookmarkCount(42, false, 2)).resolves.toBe(3);
  });
});
