import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ListItem from "../app/(tabs)/list";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" } }),
}));

const community = (id: string, name: string) => ({
  id,
  name,
  description: null,
  avatar_path: null,
  owner_id: "owner",
  created_at: "2026-10-01T09:00:00.123456+00:00",
  updated_at: "2026-10-01T09:00:00.123456+00:00",
});

// Mutable so tests can change the user's communities
let mockCommunities: ReturnType<typeof community>[] = [];
const mockCreateItem = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ myCommunities: mockCommunities, createItem: mockCreateItem }),
}));

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockCommunities = [community("c1", "Calvin Seniors")];
  mockCreateItem.mockImplementation(async (data: Record<string, unknown>) => ({
    id: "item-1",
    owner_id: "me",
    status: "available",
    image_path: null,
    return_date: null,
    ...data,
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function fillAndPost(name = "Drill") {
  await fireEvent.changeText(screen.getByPlaceholderText("Item name (e.g., 'Mini fridge')"), name);
  await fireEvent.changeText(
    screen.getByPlaceholderText("Category (e.g., 'Tools', 'Home', 'Books')"),
    " Tools "
  );
  await fireEvent.changeText(screen.getByPlaceholderText("Description (optional)"), "Cordless");
  await fireEvent.press(screen.getByText("Post Item"));
}

it("requires a title", async () => {
  await render(<ListItem />);

  await fireEvent.press(screen.getByText("Post Item"));

  expect(alertSpy).toHaveBeenCalledWith("Title required", "Please add a title for your item.");
  expect(mockCreateItem).not.toHaveBeenCalled();
});

it("creates the item in the only community, with no image fields", async () => {
  await render(<ListItem />);
  // One community is used automatically, so no picker is shown
  expect(screen.queryByText("Calvin Seniors")).toBeNull();

  await fillAndPost("  Drill ");

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Success", "Your item has been listed!", expect.any(Array))
  );
  expect(mockCreateItem).toHaveBeenCalledTimes(1);
  expect(mockCreateItem).toHaveBeenCalledWith({
    community_id: "c1",
    name: "Drill",
    description: "Cordless",
    category: "Tools",
  });
});

it("goes to the Profile tab after the success alert", async () => {
  await render(<ListItem />);
  await fillAndPost();

  await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Success", expect.any(String), expect.any(Array)));
  const buttons = alertSpy.mock.calls.find((c) => c[0] === "Success")![2];
  buttons[0].onPress();

  expect(mockPush).toHaveBeenCalledWith("/(tabs)/profile");
});

it("shows the failure alert when createItem fails", async () => {
  mockCreateItem.mockRejectedValue(new Error("Not a member of this community"));
  await render(<ListItem />);

  await fillAndPost();

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to list item. Please try again.")
  );
  expect(mockPush).not.toHaveBeenCalled();
});

it("shows Coming soon when tapping Add a Photo", async () => {
  await render(<ListItem />);

  await fireEvent.press(screen.getByText("Add a Photo"));

  expect(alertSpy).toHaveBeenCalledWith(
    "Coming soon",
    "Photo upload is being moved to the new server."
  );
});

it("asks a user with no communities to join one first", async () => {
  mockCommunities = [];
  await render(<ListItem />);

  await fillAndPost();

  expect(alertSpy).toHaveBeenCalledWith("Join a community first", expect.any(String));
  expect(mockCreateItem).not.toHaveBeenCalled();
});

it("makes a user with several communities pick one", async () => {
  mockCommunities = [community("c1", "Calvin Seniors"), community("c2", "Eastown")];
  await render(<ListItem />);

  await fillAndPost();
  expect(alertSpy).toHaveBeenCalledWith("Community required", expect.any(String));
  expect(mockCreateItem).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText("Eastown"));
  await fireEvent.press(screen.getByText("Post Item"));

  await waitFor(() =>
    expect(mockCreateItem).toHaveBeenCalledWith(expect.objectContaining({ community_id: "c2" }))
  );
});
