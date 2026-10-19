import React from "react";
import { Pressable, Text } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DatabaseProvider, useDatabase } from "../context/DatabaseContext";
import * as api from "../services/supabase_api";

const mockUseAuth = jest.fn();
jest.mock("../context/AuthContext", () => ({ useAuth: () => mockUseAuth() }));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  profiles: { getCurrent: jest.fn(), update: jest.fn() },
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
      <Text>{`communities:${db.myCommunities.map((c) => c.name).join(",")}`}</Text>
      <Text>{`items:${db.myItems.map((i) => i.name).join(",")}`}</Text>
      <Text>{`error:${db.error ?? "none"}`}</Text>
      <Pressable accessibilityLabel="leave c1" onPress={() => db.leaveCommunity("c1")}>
        <Text>leave</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: "u1" } });
  mocked(api.profiles.getCurrent).mockImplementation(() => ok({ id: "u1" }));
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

it("shows the server's error message when a load fails", async () => {
  mocked(api.communities.getMine).mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: "permission denied" } })
  );

  await render(<DatabaseProvider><Probe /></DatabaseProvider>);

  expect(await screen.findByText("error:permission denied")).toBeTruthy();
});