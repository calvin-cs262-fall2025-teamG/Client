import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import Profile from "../app/(tabs)/profile";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));

// Run the focus callback like a mount effect, as if the screen just came into focus
jest.mock("expo-router/react-navigation", () => {
  const { useEffect } = jest.requireActual("react");
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" }, logout: jest.fn() }),
}));

// Mutable so tests can change the listings; refresh keeps one identity across renders
let mockDb: { profile: unknown; myItems: unknown[]; incomingRequests: unknown[] } = {
  profile: null,
  myItems: [],
  incomingRequests: [],
};
const mockRefresh = jest.fn(() => Promise.resolve());
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ ...mockDb, refresh: mockRefresh }),
}));

jest.mock("../app/components/BookmarkButton", () => {
  const { Text } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: ({ item }: { item: { id: string } }) => <Text>{`bookmark:${item.id}`}</Text>,
  };
});

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  community_id: "c1",
  owner_id: "me",
  name: "Drill",
  description: null,
  category: "Tools",
  status: "available",
  image_path: null,
  return_date: null,
  created_at: "2026-10-19T12:00:00.123456+00:00",
  updated_at: "2026-10-19T12:00:00.123456+00:00",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDb = {
    profile: { id: "me", display_name: "Bryn Lamppa", avatar_path: null },
    myItems: [makeItem(), makeItem({ id: "item-2", name: "Tent", category: "Outdoor" })],
    incomingRequests: [],
  };
});

it("shows the display name and the listings from myItems", async () => {
  await render(<Profile />);

  expect(screen.getByText("Bryn Lamppa")).toBeTruthy();
  expect(screen.getByText("Drill")).toBeTruthy();
  expect(screen.getByText("Tent")).toBeTruthy();
  expect(screen.getByText("bookmark:item-1")).toBeTruthy();
  expect(screen.queryByText("No listings yet")).toBeNull();
  expect(mockRefresh).toHaveBeenCalled();
});

it("falls back to the auth user's display name without a profile", async () => {
  mockDb.profile = null;
  await render(<Profile />);

  expect(screen.getByText("Bryn")).toBeTruthy();
});

it("shows the empty tile when myItems is empty", async () => {
  mockDb.myItems = [];
  await render(<Profile />);

  expect(screen.getByText("No listings yet")).toBeTruthy();
});

it("shows the Borrowed badge only on a borrowed item", async () => {
  mockDb.myItems = [makeItem({ status: "available" })];
  const { rerender } = await render(<Profile />);
  expect(screen.queryByText("Borrowed")).toBeNull();

  mockDb.myItems = [makeItem({ status: "borrowed" })];
  await rerender(<Profile />);
  expect(screen.getByText("Borrowed")).toBeTruthy();
});

it("pressing Edit profile navigates to /edit-profile", async () => {
  await render(<Profile />);

  await fireEvent.press(screen.getByText("Edit profile"));

  expect(mockPush).toHaveBeenCalledWith("/edit-profile");
});

const request = (id: string, status: string) => ({
  id,
  item_id: "item-1",
  requester_id: "u2",
  status,
  requested_at: "2026-10-19T12:00:00.123456+00:00",
  decided_at: null,
});

it("pressing Requests navigates to /requests", async () => {
  await render(<Profile />);

  await fireEvent.press(screen.getByText("Requests"));

  expect(mockPush).toHaveBeenCalledWith("/requests");
});

it("shows the number of pending incoming requests on the Requests entry", async () => {
  mockDb.incomingRequests = [
    request("r1", "pending"),
    request("r2", "pending"),
    request("r3", "declined"),
  ];
  await render(<Profile />);

  expect(screen.getByText("2")).toBeTruthy();
  expect(screen.getByLabelText("Requests, 2 pending")).toBeTruthy();
});

it("shows no count when nothing is pending", async () => {
  mockDb.incomingRequests = [request("r3", "approved")];
  await render(<Profile />);

  expect(screen.getByLabelText("Requests")).toBeTruthy();
  expect(screen.queryByLabelText(/pending/)).toBeNull();
});
