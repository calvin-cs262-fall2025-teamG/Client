import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookmarksProvider, useBookmarks } from "../context/BookmarksContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// mutable so tests can switch users and rerender
let mockUser: { user_id: number; name: string } | null = null;
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const keyFor = (userId: number | "anon") => `bookmarks_byId_v2:${userId}`;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BookmarksProvider>{children}</BookmarksProvider>
);

async function storedFor(userId: number) {
  const raw = await AsyncStorage.getItem(keyFor(userId));
  return raw ? JSON.parse(raw) : null;
}

// the load effect is async; wait for its getItem call to settle before acting
async function renderBookmarks() {
  const hook = await renderHook(() => useBookmarks(), { wrapper });
  await act(async () => {});
  return hook;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockUser = { user_id: 7, name: "Bryn" };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loading", () => {
  it("restores saved bookmarks and rebuilds their images", async () => {
    await AsyncStorage.setItem(
      keyFor(7),
      JSON.stringify({
        42: { id: 42, title: "Drill", status: "none", count: 0, imageKey: "drill.jpg" },
        43: { id: 43, title: "Bike", status: "none", count: 0, imageKey: "https://x.test/bike.png" },
      })
    );

    const { result } = await renderBookmarks();

    await waitFor(() => expect(result.current.isSaved(42)).toBe(true));
    expect(result.current.byId[42].image).toBeDefined();
    expect(result.current.byId[43].image).toEqual({ uri: "https://x.test/bike.png" });
  });

  it("does not overwrite saved bookmarks before loading finishes", async () => {
    const saved = { 42: { id: 42, title: "Drill", status: "none", count: 0, imageKey: null } };
    await AsyncStorage.setItem(keyFor(7), JSON.stringify(saved));
    const setItem = jest.spyOn(AsyncStorage, "setItem");

    const { result } = await renderBookmarks();
    await waitFor(() => expect(result.current.isSaved(42)).toBe(true));

    expect(setItem).not.toHaveBeenCalledWith(keyFor(7), "{}");
    expect(await storedFor(7)).toEqual(saved);
  });

  it("is empty when signed out and never persists", async () => {
    mockUser = null;
    const setItem = jest.spyOn(AsyncStorage, "setItem");

    const { result } = await renderBookmarks();
    await act(async () => result.current.toggle({ id: 42, title: "Drill" }));

    expect(setItem).not.toHaveBeenCalled();
  });

  it("starts empty when stored data is corrupt", async () => {
    await AsyncStorage.setItem(keyFor(7), "{not json");

    const { result } = await renderBookmarks();

    expect(result.current.byId).toEqual({});
  });
});

describe("toggle / remove / clear", () => {
  it("toggle adds then removes an item and persists each change", async () => {
    const { result } = await renderBookmarks();

    await act(async () => result.current.toggle({ id: 42, title: "Drill" }));
    expect(result.current.isSaved(42)).toBe(true);
    await waitFor(async () => expect(Object.keys((await storedFor(7)) ?? {})).toEqual(["42"]));

    await act(async () => result.current.toggle({ id: 42, title: "Drill" }));
    expect(result.current.isSaved(42)).toBe(false);
    await waitFor(async () => expect(await storedFor(7)).toEqual({}));
  });

  it("remove deletes one item and ignores unknown ids", async () => {
    const { result } = await renderBookmarks();
    await act(async () => {
      result.current.toggle({ id: 1, title: "A" });
      result.current.toggle({ id: 2, title: "B" });
    });

    await act(async () => result.current.remove(1));
    await act(async () => result.current.remove(999));

    expect(Object.keys(result.current.byId)).toEqual(["2"]);
  });

  it("clear removes everything", async () => {
    const { result } = await renderBookmarks();
    await act(async () => {
      result.current.toggle({ id: 1, title: "A" });
      result.current.toggle({ id: 2, title: "B" });
    });

    await act(async () => result.current.clear());

    expect(result.current.byId).toEqual({});
  });
});

describe("item normalization", () => {
  const cases: { name: string; raw: any; expected: Record<string, unknown> }[] = [
    {
      name: "API item shape (item_id, name, request_status)",
      raw: { item_id: "42", name: "  Drill ", request_status: "pending", category: "Tools" },
      expected: { id: 42, title: "Drill", status: "pending", category: "Tools", count: 0 },
    },
    {
      name: "defaults status to none",
      raw: { id: 42, title: "Drill" },
      expected: { status: "none", imageKey: null },
    },
    {
      name: "remote image_url",
      raw: { id: 42, title: "Drill", image_url: "https://x.test/d.jpg" },
      expected: { image: { uri: "https://x.test/d.jpg" }, imageKey: "https://x.test/d.jpg" },
    },
    {
      name: "local filename is lowercased",
      raw: { id: 42, title: "Drill", image: "Drill.JPG" },
      expected: { imageKey: "drill.jpg" },
    },
    {
      name: "{ uri } image object",
      raw: { id: 42, title: "Drill", image: { uri: " file:///d.jpg " } },
      expected: { image: { uri: "file:///d.jpg" }, imageKey: "file:///d.jpg" },
    },
  ];

  it.each(cases)("$name", async ({ raw, expected }) => {
    const { result } = await renderBookmarks();

    await act(async () => result.current.toggle(raw));

    expect(result.current.byId[42]).toEqual(expect.objectContaining(expected));
  });

  it.each([
    { name: "missing id", raw: { title: "Drill" } },
    { name: "non-numeric id", raw: { id: "abc", title: "Drill" } },
    { name: "blank title", raw: { id: 42, title: "   " } },
    { name: "null", raw: null },
  ])("ignores an item with $name", async ({ raw }) => {
    const { result } = await renderBookmarks();

    await act(async () => result.current.toggle(raw));

    expect(result.current.byId).toEqual({});
  });
});

describe("switching users", () => {
  it("keeps each user's bookmarks separate", async () => {
    await AsyncStorage.setItem(
      keyFor(9),
      JSON.stringify({ 5: { id: 5, title: "Tent", status: "none", count: 0, imageKey: null } })
    );
    const { result, rerender } = await renderBookmarks();
    await act(async () => result.current.toggle({ id: 42, title: "Drill" }));

    mockUser = { user_id: 9, name: "Greg" };
    await rerender({});
    await waitFor(() => expect(result.current.isSaved(5)).toBe(true));

    expect(result.current.isSaved(42)).toBe(false);
    expect(Object.keys((await storedFor(7)) ?? {})).toEqual(["42"]);
  });

  it("does not reload when only the profile changes", async () => {
    const getItem = jest.spyOn(AsyncStorage, "getItem");
    const { result, rerender } = await renderBookmarks();

    await act(async () => result.current.toggle({ id: 42, title: "Drill" }));
    const readsBefore = getItem.mock.calls.length;
    mockUser = { user_id: 7, name: "Bryn Updated" };
    await rerender({});
    await act(async () => {});

    expect(getItem).toHaveBeenCalledTimes(readsBefore);
    expect(result.current.isSaved(42)).toBe(true);
  });
});

it("useBookmarks throws outside the provider", async () => {
  await expect(renderHook(() => useBookmarks())).rejects.toThrow(
    "useBookmarks must be used within BookmarksProvider"
  );
});
