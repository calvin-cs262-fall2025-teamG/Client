import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ItemDetail from "../app/item/[id]";
import * as api from "../services/supabase_api";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "item-1" }),
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" } }),
}));

const mockGetProfile = jest.fn();
const mockRequestToBorrow = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({
    getProfile: mockGetProfile,
    myRequests: [],
    requestToBorrow: mockRequestToBorrow,
  }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getById: jest.fn() },
  direct_messages: { create: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  community_id: "c1",
  owner_id: "greg",
  name: "Drill",
  description: "Cordless drill",
  category: "Tools",
  status: "available",
  image_path: null,
  return_date: null,
  created_at: "2026-10-19T12:00:00.000Z",
  updated_at: "2026-10-19T12:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mocked(api.items.getById).mockImplementation(() => ok(makeItem()));
  mockGetProfile.mockResolvedValue({ id: "greg", display_name: "Greg", avatar_path: null });
  mockRequestToBorrow.mockResolvedValue({ id: "r1", item_id: "item-1", status: "pending" });
  mocked(api.direct_messages.create).mockImplementation(() => ok({ id: "dm1" }));
});

it("shows the item and the owner's name", async () => {
  await render(<ItemDetail />);

  expect(await screen.findByText("Drill")).toBeTruthy();
  expect(screen.getByText("Cordless drill")).toBeTruthy();
  expect(await screen.findByText("Greg")).toBeTruthy();
  expect(api.items.getById).toHaveBeenCalledWith("item-1");
  expect(mockGetProfile).toHaveBeenCalledWith("greg");
});

it("shows Neighbor when the owner isn't found", async () => {
  mockGetProfile.mockResolvedValue(null);
  await render(<ItemDetail />);

  expect(await screen.findByText("Neighbor")).toBeTruthy();
});

it("shows currently borrowed for a borrowed item", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ status: "borrowed" })));
  await render(<ItemDetail />);

  expect(await screen.findByText("This item is currently borrowed")).toBeTruthy();
  expect(screen.queryByText("Request to Borrow")).toBeNull();
});

it("pressing Request sends the request, then opens the chat with a draft", async () => {
  // Press the "Send Request" button in the confirmation alert
  jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
    buttons?.find((b) => b.text === "Send Request")?.onPress?.();
  });
  await render(<ItemDetail />);
  await screen.findByText("Greg");

  await fireEvent.press(screen.getByText("Request to Borrow"));

  await waitFor(() =>
    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/chat-thread",
      params: {
        id: "greg",
        name: "Greg",
        draft: "Hi! I'd love to borrow your Drill.",
        itemId: "item-1",
      },
    })
  );
  expect(mockRequestToBorrow).toHaveBeenCalledWith("item-1");
  expect(api.direct_messages.create).not.toHaveBeenCalled();
});

it("shows the failure alert and stays put when the request fails", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
    buttons?.find((b) => b.text === "Send Request")?.onPress?.();
  });
  mockRequestToBorrow.mockRejectedValue(new Error("nope"));
  await render(<ItemDetail />);
  await screen.findByText("Greg");

  await fireEvent.press(screen.getByText("Request to Borrow"));

  await waitFor(() =>
    expect(alert).toHaveBeenCalledWith("Message failed", "Could not send your request. Please try again.")
  );
  expect(mockPush).not.toHaveBeenCalled();
});

it("hides the request button for your own item", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ owner_id: "me" })));
  await render(<ItemDetail />);
  await screen.findByText("Drill");

  expect(screen.queryByText("Request to Borrow")).toBeNull();
});
