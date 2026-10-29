import React from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DatabaseProvider, useDatabase } from "../context/DatabaseContext";
import * as api from "../services/supabase_api";

const mockUseAuth = jest.fn();
jest.mock("../context/AuthContext", () => ({ useAuth: () => mockUseAuth() }));

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
const mocked = (fn: unknown) => fn as jest.Mock;

function Probe() {
  const db = useDatabase();
  return (
    <>
      <Text>{`profile:${db.profile?.display_name ?? "none"}`}</Text>
      <Text>{`communities:${db.myCommunities.map((c) => c.name).join(",")}`}</Text>
      <Text>{`items:${db.myItems.map((i) => i.name).join(",")}`}</Text>
      <Text>{`error:${db.error ?? "none"}`}</Text>
      <Text>{`known:${Object.keys(db.profilesById).join(",")}`}</Text>
      <Pressable accessibilityLabel="leave c1" onPress={() => db.leaveCommunity("c1")}>
        <Text>leave</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="fetch u2"
        onPress={() => {
          void db.getProfile("u2");
          void db.getProfile("u2");
        }}
      >
        <Text>fetch</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: "u1" } });
  mocked(api.profiles.getCurrent).mockImplementation(() =>
    ok({ id: "u1", display_name: "Bryn" })
  );
  mocked(api.communities.getMine).mockImplementation(() =>
    ok([
      { id: "c1", name: "Calvin Seniors" },
      { id: "c2", name: "Knollcrest" },
    ])
  );
  mocked(api.items.getMine).mockImplementation(() => ok([{ id: "i1", name: "Drill" }]));
  mocked(api.borrowing_requests.getMine).mockImplementation(() => ok([]));
  mocked(api.borrowing_requests.getIncoming).mockImplementation(() => ok([]));
  mocked(api.borrowing_history.getMine).mockImplementation(() => ok([]));
  mocked(api.community_members.leave).mockImplementation(() => ok(null));
});

it("loads the signed-in user's data once", async () => {
  await render(<DatabaseProvider><Probe /></DatabaseProvider>);

  expect(await screen.findByText("communities:Calvin Seniors,Knollcrest")).toBeTruthy();
  expect(screen.getByText("items:Drill")).toBeTruthy();
  expect(api.communities.getMine).toHaveBeenCalledTimes(1);
});

it("makes no requests when signed out", async () => {
  mockUseAuth.mockReturnValue({ user: null });

  await render(<DatabaseProvider><Probe /></DatabaseProvider>);

  expect(screen.getByText("communities:")).toBeTruthy();
  expect(api.communities.getMine).not.toHaveBeenCalled();
});

it("removes a community from the list after leaving it", async () => {
  await render(<DatabaseProvider><Probe /></DatabaseProvider>);
  await screen.findByText("communities:Calvin Seniors,Knollcrest");

  await fireEvent.press(screen.getByLabelText("leave c1"));

  await waitFor(() => expect(screen.getByText("communities:Knollcrest")).toBeTruthy());
  expect(api.community_members.leave).toHaveBeenCalledWith("c1");
});

it("shows the error but still loads the data that worked", async () => {
  mocked(api.communities.getMine).mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: "permission denied" } })
  );

  await render(<DatabaseProvider><Probe /></DatabaseProvider>);

  expect(await screen.findByText("error:permission denied")).toBeTruthy();
  expect(screen.getByText("items:Drill")).toBeTruthy();
  expect(screen.getByText("profile:Bryn")).toBeTruthy();
  expect(screen.getByText("communities:")).toBeTruthy();
});

it("fetches a profile once and keeps it by uuid", async () => {
  mocked(api.profiles.getById).mockImplementation((id: string) =>
    ok({ id, display_name: "Greg" })
  );

  await render(<DatabaseProvider><Probe /></DatabaseProvider>);
  await screen.findByText("communities:Calvin Seniors,Knollcrest");

  // Two requests for the same person at the same time share one call
  await fireEvent.press(screen.getByLabelText("fetch u2"));
  await waitFor(() => expect(screen.getByText("known:u2")).toBeTruthy());

  // A later request is served from the cache
  await fireEvent.press(screen.getByLabelText("fetch u2"));
  expect(api.profiles.getById).toHaveBeenCalledTimes(1);
  expect(api.profiles.getById).toHaveBeenCalledWith("u2");
});
it("treats an all-null profile row as not found and doesn't cache it", async () => {
  // get_profile returns a row of nulls when no profile has that id
  mocked(api.profiles.getById).mockImplementation(() =>
    ok({ id: null, display_name: null, avatar_path: null, created_at: null, updated_at: null })
  );

  await render(<DatabaseProvider><Probe /></DatabaseProvider>);
  await screen.findByText("communities:Calvin Seniors,Knollcrest");

  await fireEvent.press(screen.getByLabelText("fetch u2"));
  await act(async () => {});
  expect(screen.getByText("known:")).toBeTruthy();

  // Not cached, so the next request asks the server again
  await fireEvent.press(screen.getByLabelText("fetch u2"));
  await act(async () => {});
  expect(api.profiles.getById).toHaveBeenCalledTimes(2);
  expect(screen.getByText("known:")).toBeTruthy();
});
