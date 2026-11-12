import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ItemCard from "../app/components/ItemCard";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

let mockSaved = new Set<string>();
const mockToggle = jest.fn();
jest.mock("../context/BookmarksContext", () => ({
  useBookmarks: () => ({ isSaved: (id: string) => mockSaved.has(id), toggle: mockToggle }),
}));

const T1 = "2026-10-19T12:00:00.123456+00:00";

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: "i1",
  name: "Drill",
  community_id: "c1",
  category: "Tools",
  status: "available",
  owner_id: "someone",
  description: null,
  image_path: null,
  return_date: null,
  created_at: T1,
  updated_at: T1,
  ...overrides,
});

beforeEach(async () => {
  jest.clearAllMocks();
  mockSaved = new Set();
  await AsyncStorage.clear();
});

it("shows one centered placeholder when there is no image", async () => {
  await render(<ItemCard item={makeItem()} />);

  expect(screen.getAllByTestId("item-card-placeholder")).toHaveLength(1);
});

it("opens the item when the card is pressed", async () => {
  await render(<ItemCard item={makeItem()} />);

  await fireEvent.press(screen.getByText("Drill"));

  expect(mockRouter.push).toHaveBeenCalledWith("/item/i1");
});

it("bookmarks someone else's item and bumps the stored count", async () => {
  await render(<ItemCard item={makeItem()} />);

  expect(screen.queryByLabelText("Edit Drill")).toBeNull();
  await fireEvent.press(screen.getByLabelText("Bookmark Drill"));

  expect(mockToggle).toHaveBeenCalledWith(expect.objectContaining({ id: "i1", title: "Drill" }));
  await waitFor(async () =>
    expect(await AsyncStorage.getItem("bookmark-count:i1")).toBe("1")
  );
});

it("shows the saved state for a bookmarked item", async () => {
  mockSaved = new Set(["i1"]);
  await render(<ItemCard item={makeItem()} />);

  expect(screen.getByLabelText("Remove bookmark for Drill")).toBeTruthy();
});

it("shows the edit button instead of the bookmark for the owner's item", async () => {
  await render(<ItemCard item={makeItem({ owner_id: "me" })} />);

  expect(screen.queryByLabelText("Bookmark Drill")).toBeNull();
  await fireEvent.press(screen.getByLabelText("Edit Drill"));

  expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/edit-item", params: { id: "i1" } });
});

it("shows the Borrowed badge and keeps the placeholder", async () => {
  await render(<ItemCard item={makeItem({ status: "borrowed" })} />);

  expect(screen.getByText("Borrowed")).toBeTruthy();
  expect(screen.getByTestId("item-card-placeholder")).toBeTruthy();
});

it("shows the community label only when asked", async () => {
  await render(<ItemCard item={makeItem()} communityName="Maple Street" />);
  expect(screen.queryByText("Maple Street")).toBeNull();

  await screen.rerender(<ItemCard item={makeItem()} communityName="Maple Street" showCommunity />);
  expect(screen.getByText("Maple Street")).toBeTruthy();
});
