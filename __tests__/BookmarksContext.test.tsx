import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BookmarksProvider, useBookmarks } from "../context/BookmarksContext";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// mutable so tests can switch users and rerender
let mockUser: { id: string; display_name: string } | null = null;
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser }),
}));

const keyFor = (userId: string) => `bookmarks_byId_v3:${userId}`;

const USER_A = "user-a-uuid";
const USER_B = "user-b-uuid";
const DRILL = "1f0c2a4e-0000-4000-8000-000000000042";
const BIKE = "1f0c2a4e-0000-4000-8000-000000000043";
const TENT = "1f0c2a4e-0000-4000-8000-000000000005";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BookmarksProvider>{children}</BookmarksProvider>
);

async function storedFor(userId: string) {
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
  mockUser = { id: USER_A, display_name: "Bryn" };
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loading", () => {
  it("restores saved bookmarks and rebuilds their images", async () => {
    await AsyncStorage.setItem(
      keyFor(USER_A),
      JSON.stringify({
        [DRILL]: { id: DRILL, title: "Drill", status: "none", count: 0, imageKey: "drill.jpg" },
        [BIKE]: { id: BIKE, title: "Bike", status: "none", count: 0, imageKey: "https://x.test/bike.png" },
      })
    );

    const { result } = await renderBookmarks();

    await waitFor(() => expect(result.current.isSaved(DRILL)).toBe(true));
    expect(result.current.byId[DRILL].image).toBeDefined();
    expect(result.current.byId[BIKE].image).toEqual({ uri: "https://x.test/bike.png" });
  });

  it("does not overwrite saved bookmarks before loading finishes", async () => {
    const saved = { [DRILL]: { id: DRILL, title: "Drill", status: "none", count: 0, imageKey: null } };
    await AsyncStorage.setItem(keyFor(USER_A), JSON.stringify(saved));
    const setItem = jest.spyOn(AsyncStorage, "setItem");

    const { result } = await renderBookmarks();
    await waitFor(() => expect(result.current.isSaved(DRILL)).toBe(true));

    expect(setItem).not.toHaveBeenCalledWith(keyFor(USER_A), "{}");
    expect(await storedFor(USER_A)).toEqual(saved);
  });

  it("is empty when signed out and never persists", async () => {
    mockUser = null;
    const setItem = jest.spyOn(AsyncStorage, "setItem");

    const { result } = await renderBookmarks();
    await act(async () => result.current.toggle({ id: DRILL, title: "Drill" }));

    expect(setItem).not.toHaveBeenCalled();
  });

  it("ignores bookmarks saved under the old v2 key", async () => {
    await AsyncStorage.setItem(
      `bookmarks_byId_v2:${USER_A}`,
      JSON.stringify({ 42: { id: 42, title: "Drill", status: "none", count: 0, imageKey: null } })
    );

    const { result } = await renderBookmarks();

    expect(result.current.byId).toEqual({});
  });

  it("starts empty when stored data is corrupt", async () => {
    await AsyncStorage.setItem(keyFor(USER_A), "{not json");

    const { result } = await renderBookmarks();

    expect(result.current.byId).toEqual({});
  });
});

describe("toggle / remove / clear", () => {
  it("toggle adds then removes an item and persists each change", async () => {
    const { result } = await renderBookmarks();

    await act(async () => result.current.toggle({ id: DRILL, title: "Drill" }));
    expect(result.current.isSaved(DRILL)).toBe(true);
    await waitFor(async () => expect(Object.keys((await storedFor(USER_A)) ?? {})).toEqual([DRILL]));

    await act(async () => result.current.toggle({ id: DRILL, title: "Drill" }));
    expect(result.current.isSaved(DRILL)).toBe(false);
    await waitFor(async () => expect(await storedFor(USER_A)).toEqual({}));
  });

  it("remove deletes one item and ignores unknown ids", async () => {
    const { result } = await renderBookmarks();
    await act(async () => {
      result.current.toggle({ id: "a", title: "A" });
      result.current.toggle({ id: "b", title: "B" });
    });

    await act(async () => result.current.remove("a"));
    await act(async () => result.current.remove("unknown"));

    expect(Object.keys(result.current.byId)).toEqual(["b"]);
  });

  it("clear removes everything", async () => {
    const { result } = await renderBookmarks();
    await act(async () => {
      result.current.toggle({ id: "a", title: "A" });
      result.current.toggle({ id: "b", title: "B" });
    });

    await act(async () => result.current.clear());

    expect(result.current.byId).toEqual({});
  });
});

describe("item normalization", () => {
  const cases: { name: string; raw: any; expected: Record<string, unknown> }[] = [
    {
      name: "Supabase item shape (id, name, status, image_path)",
      raw: { id: DRILL, name: "  Drill ", status: "pending", category: "Tools", image_path: "drill.jpg" },
      expected: { id: DRILL, title: "Drill", status: "pending", category: "Tools", count: 0, imageKey: "drill.jpg" },
    },
    {
      name: "legacy item shape (item_id, request_status)",
      raw: { item_id: DRILL, name: "Drill", request_status: "pending" },
      expected: { id: DRILL, title: "Drill", status: "pending" },
    },
    {
      name: "prefers image_path over image_url",
      raw: { id: DRILL, title: "Drill", image_path: "drill.jpg", image_url: "https://x.test/d.jpg" },
      expected: { imageKey: "drill.jpg" },
    },
    {
      name: "defaults status to none",
      raw: { id: DRILL, title: "Drill" },
      expected: { status: "none", imageKey: null },
    },
    {
      name: "remote image_url",
      raw: { id: DRILL, title: "Drill", image_url: "https://x.test/d.jpg" },
      expected: { image: { uri: "https://x.test/d.jpg" }, imageKey: "https://x.test/d.jpg" },
    },
    {
      name: "local filename is lowercased",
      raw: { id: DRILL, title: "Drill", image: "Drill.JPG" },
      expected: { imageKey: "drill.jpg" },
    },
    {
      name: "{ uri } image object",
      raw: { id: DRILL, title: "Drill", image: { uri: " file:///d.jpg " } },
      expected: { image: { uri: "file:///d.jpg" }, imageKey: "file:///d.jpg" },
    },
  ];

  it.each(cases)("$name", async ({ raw, expected }) => {
    const { result } = await renderBookmarks();

    await act(async () => result.current.toggle(raw));

    expect(result.current.byId[DRILL]).toEqual(expect.objectContaining(expected));
  });

  it.each([
    { name: "missing id", raw: { title: "Drill" } },
    { name: "blank id", raw: { id: "   ", title: "Drill" } },
    { name: "object id", raw: { id: { value: DRILL }, title: "Drill" } },
    { name: "blank title", raw: { id: DRILL, title: "   " } },
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
      keyFor(USER_B),
      JSON.stringify({ [TENT]: { id: TENT, title: "Tent", status: "none", count: 0, imageKey: null } })
    );
    const { result, rerender } = await renderBookmarks();
    await act(async () => result.current.toggle({ id: DRILL, title: "Drill" }));

    mockUser = { id: USER_B, display_name: "Greg" };
    await rerender({});
    await waitFor(() => expect(result.current.isSaved(TENT)).toBe(true));

    expect(result.current.isSaved(DRILL)).toBe(false);
    expect(Object.keys((await storedFor(USER_A)) ?? {})).toEqual([DRILL]);
  });

  it("does not reload when only the profile changes", async () => {
    const getItem = jest.spyOn(AsyncStorage, "getItem");
    const { result, rerender } = await renderBookmarks();

    await act(async () => result.current.toggle({ id: DRILL, title: "Drill" }));
    const readsBefore = getItem.mock.calls.length;
    mockUser = { id: USER_A, display_name: "Bryn Updated" };
    await rerender({});
    await act(async () => {});

    expect(getItem).toHaveBeenCalledTimes(readsBefore);
    expect(result.current.isSaved(DRILL)).toBe(true);
  });
});

it("useBookmarks throws outside the provider", async () => {
  await expect(renderHook(() => useBookmarks())).rejects.toThrow(
    "useBookmarks must be used within BookmarksProvider"
  );
});
