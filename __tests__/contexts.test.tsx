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
  await waitFor(() => expect(hook.result.current.items.myItems).toHaveLength(1));
  await waitFor(() => expect(isLoaded(hook.result.current)).toBe(true));
  return hook;
}

// Everything the contexts hold, to check a failed call changed nothing
const snapshot = (all: All) => ({
  profile: all.profile.profile,
  profilesById: all.profile.profilesById,
  myCommunities: all.community.myCommunities,
  myItems: all.items.myItems,
  myRequests: all.borrowing.myRequests,
  incomingRequests: all.borrowing.incomingRequests,
  borrowingHistory: all.borrowing.borrowingHistory,
});

const loaders = () => [
  api.profiles.getCurrent,
  api.communities.getMine,
  api.items.getMine,
  api.borrowing_requests.getMine,
  api.borrowing_requests.getIncoming,
  api.borrowing_history.getMine,
];

beforeEach(() => {
  jest.clearAllMocks();
  mocked(api.profiles.getCurrent).mockImplementation(() => ok({ id: "u1", display_name: "Bryn" }));
  mocked(api.communities.getMine).mockImplementation(() => ok([{ id: "c1", name: "Knollcrest" }]));
  mocked(api.items.getMine).mockImplementation(() =>
    ok([{ id: "i1", name: "Drill", status: "pending" }])
  );
  mocked(api.borrowing_requests.getMine).mockImplementation(() =>
    ok([{ id: "r1", item_id: "i9", status: "pending" }])
  );
  mocked(api.borrowing_requests.getIncoming).mockImplementation(() =>
    ok([{ id: "r2", item_id: "i1", status: "pending" }])
  );
  mocked(api.borrowing_history.getMine).mockImplementation(() => ok([{ id: "h1", request_id: "r0" }]));
});

describe("loading", () => {
  it("a load that rejects sets that context's error without blocking the others", async () => {
    mocked(api.items.getMine).mockImplementation(() =>
      Promise.reject(new Error("Network request failed"))
    );

    const { result } = await renderHook(useAll, { wrapper });

    await waitFor(() => expect(result.current.items.error).toBe("Network request failed"));
    await waitFor(() => expect(isLoaded(result.current)).toBe(true));
    expect(result.current.items.myItems).toEqual([]);
    expect(result.current.profile.profile?.display_name).toBe("Bryn");
    expect(result.current.community.myCommunities).toHaveLength(1);
    expect(result.current.borrowing.incomingRequests).toHaveLength(1);
    expect(result.current.profile.error).toBeNull();
    expect(result.current.community.error).toBeNull();
    expect(result.current.borrowing.error).toBeNull();
  });

  it("a failing communities.getMine sets only useCommunities().error", async () => {
    mocked(api.communities.getMine).mockImplementation(() => fail("permission denied"));

    const { result } = await renderLoaded();

    expect(result.current.community.error).toBe("permission denied");
    expect(result.current.profile.error).toBeNull();
    expect(result.current.items.error).toBeNull();
    expect(result.current.borrowing.error).toBeNull();
  });
});

describe("a mutation whose RPC returns an error rejects and changes nothing", () => {
  const cases: [string, () => unknown, (all: All) => Promise<unknown>][] = [
    ["createItem", () => api.items.create, (a) => a.items.createItem({ name: "Tent" } as never)],
    ["updateItem", () => api.items.update, (a) => a.items.updateItem("i1", { name: "Saw" })],
    ["deleteItem", () => api.items.delete, (a) => a.items.deleteItem("i1")],
    ["requestToBorrow", () => api.borrowing_requests.create, (a) => a.borrowing.requestToBorrow("i9")],
    ["cancelRequest", () => api.borrowing_requests.cancel, (a) => a.borrowing.cancelRequest("r1")],
    ["declineRequest", () => api.borrowing_requests.decline, (a) => a.borrowing.declineRequest("r2")],
    ["approveRequest", () => api.borrowing_requests.approve, (a) => a.borrowing.approveRequest("r2")],
    ["markReturned", () => api.borrowing_history.markReturned, (a) => a.borrowing.markReturned("r2")],
    ["createCommunity", () => api.communities.create, (a) => a.community.createCommunity({ name: "Eastown" } as never)],
    ["requestToJoin", () => api.community_members.requestToJoin, (a) => a.community.requestToJoin("c2")],
    ["leaveCommunity", () => api.community_members.leave, (a) => a.community.leaveCommunity("c1")],
    ["updateProfile", () => api.profiles.update, (a) => a.profile.updateProfile({ display_name: "B" } as never)],
  ];

  it.each(cases)("%s", async (_name, rpc, call) => {
    mocked(rpc()).mockImplementation(() => fail("permission denied"));
    const { result } = await renderLoaded();
    const before = snapshot(result.current);

    await act(async () => {
      await expect(call(result.current)).rejects.toThrow("permission denied");
    });

    expect(snapshot(result.current)).toEqual(before);
  });
});

describe("approveRequest and markReturned", () => {
  const cases: [string, () => unknown, (all: All) => Promise<void>][] = [
    ["approveRequest", () => api.borrowing_requests.approve, (a) => a.borrowing.approveRequest("r2")],
    ["markReturned", () => api.borrowing_history.markReturned, (a) => a.borrowing.markReturned("r2")],
  ];

  it.each(cases)("%s refreshes borrowing data and items, not profile or communities", async (_name, rpc, call) => {
    mocked(rpc()).mockImplementation(() => ok({ id: "r2" }));
    const { result } = await renderLoaded();
    loaders().forEach((fn) => mocked(fn).mockClear());
    mocked(api.items.getMine).mockImplementation(() =>
      ok([{ id: "i1", name: "Drill", status: "borrowed" }])
    );
    mocked(api.borrowing_requests.getIncoming).mockImplementation(() =>
      ok([{ id: "r2", item_id: "i1", status: "approved" }])
    );

    await act(async () => {
      await call(result.current);
    });

    expect(api.borrowing_requests.getMine).toHaveBeenCalledTimes(1);
    expect(api.borrowing_requests.getIncoming).toHaveBeenCalledTimes(1);
    expect(api.borrowing_history.getMine).toHaveBeenCalledTimes(1);
    expect(api.items.getMine).toHaveBeenCalledTimes(1);
    expect(api.profiles.getCurrent).not.toHaveBeenCalled();
    expect(api.communities.getMine).not.toHaveBeenCalled();
    expect(result.current.items.myItems[0].status).toBe("borrowed");
    expect(result.current.borrowing.incomingRequests[0].status).toBe("approved");
  });

  it.each(cases)("%s refreshes nothing when the RPC fails", async (_name, rpc, call) => {
    mocked(rpc()).mockImplementation(() => fail("not allowed"));
    const { result } = await renderLoaded();
    loaders().forEach((fn) => mocked(fn).mockClear());

    await act(async () => {
      await expect(call(result.current)).rejects.toThrow("not allowed");
    });

    loaders().forEach((fn) => expect(fn).not.toHaveBeenCalled());
  });
});
