import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { DatabaseProvider } from "../context/DatabaseContext";
import { useProfile } from "../context/ProfileContext";
import { useCommunities } from "../context/CommunityContext";
import { useItems } from "../context/ItemsContext";
import { useBorrowing } from "../context/BorrowingContext";
import * as api from "../services/supabase_api";

jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  profiles: { getCurrent: jest.fn(), getById: jest.fn(), update: jest.fn() },
  communities: { getMine: jest.fn(), create: jest.fn() },
  community_members: { requestToJoin: jest.fn(), leave: jest.fn() },
  items: { getMine: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  borrowing_requests: {
    getMine: jest.fn(),
    getIncoming: jest.fn(),
    create: jest.fn(),
    cancel: jest.fn(),
    decline: jest.fn(),
    approve: jest.fn(),
  },
  borrowing_history: { getMine: jest.fn(), markReturned: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const fail = (message: string) => Promise.resolve({ data: null, error: { message } });
const mocked = (fn: unknown) => fn as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DatabaseProvider>{children}</DatabaseProvider>
);

function useAll() {
  return {
    profile: useProfile(),
    community: useCommunities(),
    items: useItems(),
    borrowing: useBorrowing(),
  };
}
type All = ReturnType<typeof useAll>;

const isLoaded = (all: All) =>
  !all.profile.loading && !all.community.loading && !all.items.loading && !all.borrowing.loading;

async function renderLoaded() {
  const hook = await renderHook(useAll, { wrapper });
  await waitFor(() => expect(hook.result.current.items.myItems).toHaveLength(2));
  await waitFor(() => expect(isLoaded(hook.result.current)).toBe(true));
  return hook;
}

const DRILL = { id: "i1", name: "Drill", status: "available" };
const TENT = { id: "i2", name: "Tent", status: "available" };

beforeEach(() => {
  jest.clearAllMocks();
  mocked(api.profiles.getCurrent).mockImplementation(() => ok({ id: "u1", display_name: "Bryn" }));
  mocked(api.communities.getMine).mockImplementation(() => ok([{ id: "c1", name: "Maple Street" }]));
  mocked(api.items.getMine).mockImplementation(() => ok([DRILL, TENT]));
  mocked(api.borrowing_requests.getMine).mockImplementation(() =>
    ok([{ id: "r1", item_id: "x", status: "pending" }])
  );
  mocked(api.borrowing_requests.getIncoming).mockImplementation(() =>
    ok([{ id: "r2", item_id: "i1", status: "pending" }])
  );
  mocked(api.borrowing_history.getMine).mockImplementation(() => ok([]));
});

describe("useItems", () => {
  it("createItem adds the new item to the front of myItems", async () => {
    mocked(api.items.create).mockImplementation(() => ok({ id: "i3", name: "Ladder", status: "available" }));
    const { result } = await renderLoaded();

    let created: unknown;
    await act(async () => {
      created = await result.current.items.createItem({ community_id: "c1", name: "Ladder" });
    });

    expect(created).toEqual({ id: "i3", name: "Ladder", status: "available" });
    expect(result.current.items.myItems.map((i) => i.id)).toEqual(["i3", "i1", "i2"]);
    expect(api.items.create).toHaveBeenCalledWith({ community_id: "c1", name: "Ladder" });
  });

  it("updateItem replaces only that item, in place", async () => {
    mocked(api.items.update).mockImplementation(() => ok({ ...DRILL, name: "Hammer drill" }));
    const { result } = await renderLoaded();

    await act(() => result.current.items.updateItem("i1", { name: "Hammer drill" }).then(() => {}));

    expect(result.current.items.myItems).toEqual([{ ...DRILL, name: "Hammer drill" }, TENT]);
    expect(api.items.update).toHaveBeenCalledWith("i1", { name: "Hammer drill" });
  });

  it("deleteItem removes the item", async () => {
    mocked(api.items.delete).mockImplementation(() => ok(null));
    const { result } = await renderLoaded();

    await act(() => result.current.items.deleteItem("i1"));

    expect(result.current.items.myItems).toEqual([TENT]);
  });
});

describe("useBorrowing", () => {
  it("requestToBorrow adds the new request to the front of myRequests", async () => {
    const created = { id: "r3", item_id: "i9", status: "pending" };
    mocked(api.borrowing_requests.create).mockImplementation(() => ok(created));
    const { result } = await renderLoaded();

    let returned: unknown;
    await act(async () => {
      returned = await result.current.borrowing.requestToBorrow("i9");
    });

    expect(returned).toEqual(created);
    expect(result.current.borrowing.myRequests.map((r) => r.id)).toEqual(["r3", "r1"]);
  });

  it("cancelRequest replaces my request with the cancelled one", async () => {
    mocked(api.borrowing_requests.cancel).mockImplementation(() =>
      ok({ id: "r1", item_id: "x", status: "cancelled" })
    );
    const { result } = await renderLoaded();

    await act(() => result.current.borrowing.cancelRequest("r1"));

    expect(result.current.borrowing.myRequests).toEqual([{ id: "r1", item_id: "x", status: "cancelled" }]);
    expect(result.current.borrowing.incomingRequests[0].status).toBe("pending");
  });

  it("declineRequest replaces the incoming request with the declined one", async () => {
    mocked(api.borrowing_requests.decline).mockImplementation(() =>
      ok({ id: "r2", item_id: "i1", status: "declined" })
    );
    const { result } = await renderLoaded();

    await act(() => result.current.borrowing.declineRequest("r2"));

    expect(result.current.borrowing.incomingRequests).toEqual([
      { id: "r2", item_id: "i1", status: "declined" },
    ]);
    expect(result.current.borrowing.myRequests[0].status).toBe("pending");
  });
});

describe("useCommunities", () => {
  it("createCommunity adds the new community to the end of myCommunities", async () => {
    mocked(api.communities.create).mockImplementation(() => ok({ id: "c2", name: "Oak Hall" }));
    const { result } = await renderLoaded();

    let created: unknown;
    await act(async () => {
      created = await result.current.community.createCommunity({ name: "Oak Hall" });
    });

    expect(created).toEqual({ id: "c2", name: "Oak Hall" });
    expect(result.current.community.myCommunities.map((c) => c.id)).toEqual(["c1", "c2"]);
  });
});

describe("useProfile", () => {
  it("updateProfile replaces the profile", async () => {
    mocked(api.profiles.update).mockImplementation(() => ok({ id: "u1", display_name: "Bryn L" }));
    const { result } = await renderLoaded();

    let updated: unknown;
    await act(async () => {
      updated = await result.current.profile.updateProfile({ display_name: "Bryn L" });
    });

    expect(updated).toEqual({ id: "u1", display_name: "Bryn L" });
    expect(result.current.profile.profile).toEqual({ id: "u1", display_name: "Bryn L" });
  });

  describe("getProfile", () => {
    it("returns null on an RPC error and does not cache it", async () => {
      mocked(api.profiles.getById).mockImplementation(() => fail("permission denied"));
      const { result } = await renderLoaded();

      let found: unknown = "not called";
      await act(async () => {
        found = await result.current.profile.getProfile("greg");
      });

      expect(found).toBeNull();
      expect(result.current.profile.profilesById).toEqual({});
    });

    it("asks the server again on a retry after an error", async () => {
      mocked(api.profiles.getById)
        .mockImplementationOnce(() => fail("network down"))
        .mockImplementationOnce(() => ok({ id: "greg", display_name: "Greg" }));
      const { result } = await renderLoaded();

      await act(() => result.current.profile.getProfile("greg").then(() => {}));
      let found: unknown;
      await act(async () => {
        found = await result.current.profile.getProfile("greg");
      });

      expect(api.profiles.getById).toHaveBeenCalledTimes(2);
      expect(found).toEqual({ id: "greg", display_name: "Greg" });
      expect(result.current.profile.profilesById).toEqual({
        greg: { id: "greg", display_name: "Greg" },
      });
    });

    it("caches a found profile so the next call doesn't hit the server", async () => {
      mocked(api.profiles.getById).mockImplementation(() => ok({ id: "greg", display_name: "Greg" }));
      const { result } = await renderLoaded();

      await act(() => result.current.profile.getProfile("greg").then(() => {}));
      await act(() => result.current.profile.getProfile("greg").then(() => {}));

      expect(api.profiles.getById).toHaveBeenCalledTimes(1);
    });
  });
});
