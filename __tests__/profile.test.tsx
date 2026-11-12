import React from "react";
import { Alert, Platform, type AlertButton } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import Profile from "../app/(tabs)/profile";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: jest.fn() }),
}));

// Run the focus callback like a mount effect, as if the screen just came into focus
jest.mock("expo-router/react-navigation", () => {
  const { useEffect } = jest.requireActual("react");
  return { useFocusEffect: (cb: () => void) => useEffect(cb, [cb]) };
});

const mockLogout = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" }, logout: mockLogout }),
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

describe("Sign out", () => {
  // Answer the next Alert with the button that has this text.
  const answerAlertWith = (buttonText: string) =>
    jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons?: AlertButton[]) => {
      buttons?.find((b) => b.text === buttonText)?.onPress?.();
    });

  beforeEach(() => {
    mockLogout.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("asks first, then signs out and goes to the login screen", async () => {
    const alert = answerAlertWith("Sign out");
    await render(<Profile />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(alert).toHaveBeenCalledWith("Sign out?", expect.any(String), expect.any(Array));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(auth)/login"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the user cancels", async () => {
    answerAlertWith("Cancel");
    await render(<Profile />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("uses the browser's confirm dialog on web", async () => {
    jest.replaceProperty(Platform, "OS", "web");
    const alert = jest.spyOn(Alert, "alert");
    window.confirm = jest.fn(() => true);
    await render(<Profile />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Sign out?"));
    expect(alert).not.toHaveBeenCalled();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(auth)/login"));
  });

  it("shows a message and stays put when signing out fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    mockLogout.mockRejectedValue(new Error("network down"));
    const alert = answerAlertWith("Sign out");
    await render(<Profile />);

    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Couldn't sign out", "Please try again.", expect.any(Array))
    );
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
