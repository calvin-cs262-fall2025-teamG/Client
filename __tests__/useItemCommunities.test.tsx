import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as api from "../services/supabase_api";
import {
  MAX_CONCURRENT_LOOKUPS,
  clearItemCommunities,
  useItemCommunities,
} from "../hooks/useItemCommunities";

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getCommunityIds: jest.fn() },
}));

let mockUserId: string | null = "me";
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUserId ? { id: mockUserId } : null }),
}));

const mocked = (fn: unknown) => fn as jest.Mock;
const getCommunityIds = mocked(api.items.getCommunityIds);

const ok = (data: string[]) => ({ data, error: null });

// Lookups that finish only when the test says so.
let resolvers: Record<string, (result: unknown) => void> = {};
function deferLookups() {
  getCommunityIds.mockImplementation(
    (id: string) => new Promise((resolve) => (resolvers[id] = resolve))
  );
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `i${i + 1}`);

beforeEach(() => {
  jest.clearAllMocks();
  mockUserId = "me";
  resolvers = {};
  getCommunityIds.mockImplementation(async (id: string) => ok([`c-${id}`]));
  clearItemCommunities();
});

describe("useItemCommunities", () => {
  it("returns each item's community ids once they load", async () => {
    getCommunityIds.mockImplementation(async (id: string) =>
      ok(id === "i1" ? ["c1", "c2"] : ["c3"])
    );
    const { result } = await renderHook(() => useItemCommunities(["i1", "i2"]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.communityIdsByItem).toEqual({ i1: ["c1", "c2"], i2: ["c3"] });
    expect(getCommunityIds).toHaveBeenCalledTimes(2);
  });

  it("is loading until every item has loaded", async () => {
    deferLookups();
    const { result } = await renderHook(() => useItemCommunities(["i1", "i2"]));

    expect(result.current.loading).toBe(true);
    await act(async () => resolvers.i1(ok(["c1"])));
    expect(result.current.loading).toBe(true);
    expect(result.current.communityIdsByItem).toEqual({ i1: ["c1"] });

    await act(async () => resolvers.i2(ok([])));
    expect(result.current.loading).toBe(false);
  });

  it("isn't loading with no items", async () => {
    const { result } = await renderHook(() => useItemCommunities([]));

    expect(result.current.loading).toBe(false);
    expect(getCommunityIds).not.toHaveBeenCalled();
  });

  it("keeps results after the screen unmounts, so another screen doesn't refetch", async () => {
    const first = await renderHook(() => useItemCommunities(["i1", "i2"]));
    await waitFor(() => expect(first.result.current.loading).toBe(false));
    await first.unmount();

    const second = await renderHook(() => useItemCommunities(["i2", "i1"]));

    expect(second.result.current.loading).toBe(false);
    expect(second.result.current.communityIdsByItem).toEqual({ i1: ["c-i1"], i2: ["c-i2"] });
    expect(getCommunityIds).toHaveBeenCalledTimes(2);
  });

  it("only fetches the ids that aren't cached yet", async () => {
    const hook = await renderHook(({ list }: { list: string[] }) => useItemCommunities(list), {
      initialProps: { list: ["i1"] },
    });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    await hook.rerender({ list: ["i1", "i2"] });

    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(getCommunityIds.mock.calls.map(([id]) => id)).toEqual(["i1", "i2"]);
  });

  it("shares a lookup that is already in flight between screens", async () => {
    deferLookups();
    await renderHook(() => useItemCommunities(["i1"]));
    const other = await renderHook(() => useItemCommunities(["i1"]));

    await act(async () => resolvers.i1(ok(["c1"])));

    expect(getCommunityIds).toHaveBeenCalledTimes(1);
    expect(other.result.current.communityIdsByItem).toEqual({ i1: ["c1"] });
  });

  it(`runs at most ${MAX_CONCURRENT_LOOKUPS} lookups at once`, async () => {
    let inFlight = 0;
    let peak = 0;
    getCommunityIds.mockImplementation(
      (id: string) =>
        new Promise((resolve) => {
          inFlight++;
          peak = Math.max(peak, inFlight);
          resolvers[id] = (value) => {
            inFlight--;
            resolve(value);
          };
        })
    );
    const { result } = await renderHook(() => useItemCommunities(ids(10)));

    expect(getCommunityIds).toHaveBeenCalledTimes(MAX_CONCURRENT_LOOKUPS);

    // Each finished lookup lets one waiting lookup start.
    await act(async () => resolvers.i1(ok([])));
    expect(getCommunityIds).toHaveBeenCalledTimes(MAX_CONCURRENT_LOOKUPS + 1);

    for (const id of ids(10).slice(1)) {
      await waitFor(() => expect(resolvers[id]).toBeDefined());
      await act(async () => resolvers[id](ok([])));
    }

    expect(result.current.loading).toBe(false);
    expect(getCommunityIds).toHaveBeenCalledTimes(10);
    expect(peak).toBe(MAX_CONCURRENT_LOOKUPS);
  });

  it("treats a failed lookup as unknown instead of crashing", async () => {
    getCommunityIds.mockImplementation(async (id: string) => {
      if (id === "i1") return { data: null, error: { message: "boom" } };
      if (id === "i2") throw new Error("network down");
      return ok(["c3"]);
    });
    const { result } = await renderHook(() => useItemCommunities(["i1", "i2", "i3"]));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.communityIdsByItem).toEqual({ i3: ["c3"] });
  });

  it("doesn't retry a failed lookup until refresh", async () => {
    getCommunityIds.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    const first = await renderHook(() => useItemCommunities(["i1"]));
    await waitFor(() => expect(first.result.current.loading).toBe(false));

    const second = await renderHook(() => useItemCommunities(["i1"]));
    expect(getCommunityIds).toHaveBeenCalledTimes(1);

    await act(() => second.result.current.refresh());

    expect(getCommunityIds).toHaveBeenCalledTimes(2);
    expect(second.result.current.communityIdsByItem).toEqual({ i1: ["c-i1"] });
  });

  it("refresh keeps the old lists until the new lookups come back, then swaps them in", async () => {
    const other = await renderHook(() => useItemCommunities(["i9"]));
    const { result } = await renderHook(() => useItemCommunities(["i1", "i2"]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    getCommunityIds.mockClear();
    deferLookups();

    let refreshed!: Promise<void>;
    await act(async () => {
      refreshed = result.current.refresh();
    });

    // Only the hook's own ids are looked up again, and the old lists stay meanwhile.
    expect(getCommunityIds.mock.calls.map(([id]) => id).sort()).toEqual(["i1", "i2"]);
    expect(result.current.communityIdsByItem).toEqual({ i1: ["c-i1"], i2: ["c-i2"] });
    expect(result.current.loading).toBe(false);

    await act(async () => resolvers.i1(ok(["new-i1"])));
    expect(result.current.communityIdsByItem).toEqual({ i1: ["new-i1"], i2: ["c-i2"] });

    await act(async () => {
      resolvers.i2(ok(["new-i2"]));
      await refreshed;
    });
    expect(result.current.communityIdsByItem).toEqual({ i1: ["new-i1"], i2: ["new-i2"] });
    expect(other.result.current.communityIdsByItem).toEqual({ i9: ["c-i9"] });
  });

  it("keeps the old list when a refresh lookup fails", async () => {
    const { result } = await renderHook(() => useItemCommunities(["i1", "i2"]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    getCommunityIds.mockImplementation(async (id: string) => {
      if (id === "i1") return { data: null, error: { message: "boom" } };
      throw new Error("network down");
    });

    await act(() => result.current.refresh());

    expect(getCommunityIds).toHaveBeenCalledTimes(4);
    expect(result.current.communityIdsByItem).toEqual({ i1: ["c-i1"], i2: ["c-i2"] });
  });

  it("ignores a refresh result that a sign-out made stale", async () => {
    const hook = await renderHook(() => useItemCommunities(["i1"]));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    deferLookups();
    await act(async () => {
      void hook.result.current.refresh();
    });

    mockUserId = null;
    await hook.rerender({});
    await act(async () => resolvers.i1(ok(["old-user-community"])));

    expect(hook.result.current.communityIdsByItem).toEqual({});
  });

  it("clears the cache on sign-out and looks up again for the next user", async () => {
    const hook = await renderHook(() => useItemCommunities(["i1"]));
    await waitFor(() => expect(hook.result.current.loading).toBe(false));

    mockUserId = null;
    await hook.rerender({});

    expect(hook.result.current.communityIdsByItem).toEqual({});
    expect(hook.result.current.loading).toBe(false);
    expect(getCommunityIds).toHaveBeenCalledTimes(1);

    mockUserId = "someone-else";
    await hook.rerender({});

    await waitFor(() => expect(hook.result.current.communityIdsByItem).toEqual({ i1: ["c-i1"] }));
    expect(getCommunityIds).toHaveBeenCalledTimes(2);
  });

  it("drops a lookup that finishes after sign-out", async () => {
    deferLookups();
    const hook = await renderHook(() => useItemCommunities(["i1"]));

    mockUserId = null;
    await hook.rerender({});
    await act(async () => resolvers.i1(ok(["old-user-community"])));

    expect(hook.result.current.communityIdsByItem).toEqual({});
  });

  it("frees every slot on sign-out, even from lookups that never finish", async () => {
    getCommunityIds.mockReturnValue(new Promise(() => {}));
    const hook = await renderHook(() => useItemCommunities(ids(8)));
    expect(getCommunityIds).toHaveBeenCalledTimes(MAX_CONCURRENT_LOOKUPS);

    mockUserId = null;
    await hook.rerender({});
    getCommunityIds.mockClear();
    getCommunityIds.mockImplementation(async (id: string) => ok([`c-${id}`]));
    mockUserId = "me";
    await hook.rerender({});

    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(getCommunityIds).toHaveBeenCalledTimes(8);
  });
});
