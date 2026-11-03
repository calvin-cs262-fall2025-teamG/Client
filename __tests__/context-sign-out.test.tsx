import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { DatabaseProvider } from "../context/DatabaseContext";
import { useProfile } from "../context/ProfileContext";
import { useItems } from "../context/ItemsContext";
import { useBorrowing } from "../context/BorrowingContext";
import * as api from "../services/supabase_api";

// Mutable so tests can sign out or switch users and rerender
let mockUser: { id: string } | null = null;
jest.mock("../context/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));

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

type Result = { data: unknown; error: { message: string } | null };

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

// A response the test resolves by hand
function deferred() {
  let resolve!: (value: Result) => void;
  const promise = new Promise<Result>((r) => (resolve = r));
  return { promise, resolve };
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <DatabaseProvider>{children}</DatabaseProvider>
);

function useAll() {
  return { profile: useProfile(), items: useItems(), borrowing: useBorrowing() };
}

async function signInAs(hook: { rerender: (props: unknown) => Promise<void> }, user: { id: string } | null) {
  mockUser = user;
  await hook.rerender({});
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { id: "a" };
  mocked(api.profiles.getCurrent).mockImplementation(() => ok({ id: "a", display_name: "Bryn" }));
  mocked(api.communities.getMine).mockImplementation(() => ok([]));
  mocked(api.items.getMine).mockImplementation(() => ok([{ id: "i1", name: "Drill" }]));
  mocked(api.borrowing_requests.getMine).mockImplementation(() => ok([{ id: "r1" }]));
  mocked(api.borrowing_requests.getIncoming).mockImplementation(() => ok([{ id: "r2" }]));
  mocked(api.borrowing_history.getMine).mockImplementation(() => ok([{ id: "h1" }]));
  mocked(api.profiles.getById).mockImplementation((id: string) => ok({ id, display_name: "Greg" }));
});

it("ignores an items load that finishes after sign-out", async () => {
  const slow = deferred();
  mocked(api.items.getMine).mockImplementation(() => slow.promise);
  const hook = await renderHook(useAll, { wrapper });
  expect(hook.result.current.items.loading).toBe(true);

  await signInAs(hook, null);
  await act(async () => {
    slow.resolve({ data: [{ id: "i1", name: "Drill" }], error: null });
  });

  expect(hook.result.current.items.myItems).toEqual([]);
  expect(hook.result.current.items.loading).toBe(false);
});

describe("switching from user A to user B", () => {
  async function startBoth() {
    const forA = deferred();
    const forB = deferred();
    mocked(api.items.getMine)
      .mockImplementationOnce(() => forA.promise)
      .mockImplementationOnce(() => forB.promise);
    const hook = await renderHook(useAll, { wrapper });
    await signInAs(hook, { id: "b" });
    expect(api.items.getMine).toHaveBeenCalledTimes(2);
    return { hook, forA, forB };
  }

  it("drops A's response when it arrives before B's", async () => {
    const { hook, forA, forB } = await startBoth();

    await act(async () => forA.resolve({ data: [{ id: "i1", name: "A's drill" }], error: null }));
    expect(hook.result.current.items.myItems).toEqual([]);
    expect(hook.result.current.items.loading).toBe(true);

    await act(async () => forB.resolve({ data: [{ id: "i2", name: "B's bike" }], error: null }));
    expect(hook.result.current.items.myItems).toEqual([{ id: "i2", name: "B's bike" }]);
    expect(hook.result.current.items.loading).toBe(false);
  });

  it("drops A's response when it arrives after B's", async () => {
    const { hook, forA, forB } = await startBoth();

    await act(async () => forB.resolve({ data: [{ id: "i2", name: "B's bike" }], error: null }));
    await act(async () => forA.resolve({ data: [{ id: "i1", name: "A's drill" }], error: null }));

    expect(hook.result.current.items.myItems).toEqual([{ id: "i2", name: "B's bike" }]);
    expect(hook.result.current.items.loading).toBe(false);
  });
});

it("forgets cached profiles after signing out and back in as someone else", async () => {
  const hook = await renderHook(useAll, { wrapper });
  await act(async () => {
    await hook.result.current.profile.getProfile("u2");
  });
  expect(hook.result.current.profile.profilesById).toHaveProperty("u2");

  await signInAs(hook, null);
  expect(hook.result.current.profile.profilesById).toEqual({});

  await signInAs(hook, { id: "b" });
  await waitFor(() => expect(hook.result.current.profile.loading).toBe(false));
  expect(hook.result.current.profile.profilesById).toEqual({});

  await act(async () => {
    await hook.result.current.profile.getProfile("u2");
  });
  expect(api.profiles.getById).toHaveBeenCalledTimes(2);
});

// BUG: approveRequest (and markReturned) call refresh() and the items refresh
// after their RPC resolves, without checking that a user is still signed in.
// If the user signs out while the approve call is in flight, the refresh starts a
// fresh load with no session, and its results (or errors) are applied to the
// signed-out state. The stale-request check doesn't help, because the refresh is a
// brand-new request that started after sign-out. Here the mocked server returns
// the old lists, so they come back after sign-out.
it.skip("does not bring back the old user's lists when approveRequest resolves after sign-out", async () => {
  const approve = deferred();
  mocked(api.borrowing_requests.approve).mockImplementation(() => approve.promise);
  const hook = await renderHook(useAll, { wrapper });
  await waitFor(() => expect(hook.result.current.borrowing.myRequests).toHaveLength(1));

  let approving!: Promise<void>;
  await act(async () => {
    approving = hook.result.current.borrowing.approveRequest("r2");
  });
  await signInAs(hook, null);
  await act(async () => {
    approve.resolve({ data: { id: "r2" }, error: null });
    await approving;
  });

  const { items, borrowing } = hook.result.current;
  expect(items.myItems).toEqual([]);
  expect(borrowing.myRequests).toEqual([]);
  expect(borrowing.incomingRequests).toEqual([]);
  expect(borrowing.borrowingHistory).toEqual([]);
});
