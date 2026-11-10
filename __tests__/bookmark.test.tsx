import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import BookmarkScreen from "../app/bookmark";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

// Mutable so tests can set the saved items
let mockById: Record<string, { id: string; title: string; status?: string; count?: number }> = {};
const mockRemove = jest.fn();
jest.mock("../context/BookmarksContext", () => ({
  useBookmarks: () => ({
    byId: mockById,
    isSaved: (id: string) => !!mockById[id],
    toggle: jest.fn(),
    remove: mockRemove,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockById = {};
});

it("shows No bookmarks yet when nothing is saved", async () => {
  await render(<BookmarkScreen />);

  expect(screen.getByText("No bookmarks yet")).toBeTruthy();
  expect(screen.getByText("Tap the bookmark icon on an item to save it.")).toBeTruthy();
});

it("shows saved items instead of the empty state", async () => {
  mockById = {
    i1: { id: "i1", title: "Drill", count: 3 },
    i2: { id: "i2", title: "Tent", status: "borrowed" },
  };

  await render(<BookmarkScreen />);

  expect(screen.queryByText("No bookmarks yet")).toBeNull();
  expect(screen.getByText("Drill")).toBeTruthy();
  expect(screen.getByText("3")).toBeTruthy();
  expect(screen.getByText("Tent")).toBeTruthy();
  expect(screen.getByText("Borrowed")).toBeTruthy();
});

it("opens an item when its name is tapped", async () => {
  mockById = { i1: { id: "i1", title: "Drill" } };
  await render(<BookmarkScreen />);

  await fireEvent.press(screen.getByText("Drill"));

  expect(mockPush).toHaveBeenCalledWith("/item/i1");
});
