import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import Index from "../app/(tabs)/index";
import * as api from "../services/supabase_api";
import { ITEM_CATEGORIES } from "../constants/categories";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getAll: jest.fn() },
}));

let mockUserId = "me";
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: mockUserId } }),
}));

jest.mock("../context/BookmarksContext", () => ({
  useBookmarks: () => ({ byId: {}, isSaved: () => false, toggle: jest.fn() }),
}));

let mockCommunities: { id: string; name: string }[] = [];
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ myCommunities: mockCommunities }),
}));

const mocked = (fn: unknown) => fn as jest.Mock;

const T1 = "2026-10-19T12:00:00.123456+00:00";

const item = (id: string, name: string, community_id: string, category: string) => ({
  id,
  name,
  community_id,
  category,
  status: "available",
  owner_id: "someone",
  description: null,
  image_path: null,
  return_date: null,
  created_at: T1,
  updated_at: T1,
});

const ITEMS = [
  item("i1", "Drill", "c1", "Tools"),
  item("i2", "Tent", "c2", "Outdoor"),
  item("i3", "Hammer", "c1", "Tools"),
];

// Waits for the grid to load; pass an item that the starting filter shows.
async function renderHome(visibleItem = "Drill") {
  await render(<Index />);
  await screen.findByText(visibleItem);
}

async function pickCommunity(name: string) {
  await fireEvent.press(screen.getByLabelText("Choose community"));
  await fireEvent.press(screen.getByRole("button", { name }));
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  await AsyncStorage.clear();
  mockUserId = "me";
  mockCommunities = [
    { id: "c1", name: "Maple Street" },
    { id: "c2", name: "Oak Hall" },
  ];
  mocked(api.items.getAll).mockResolvedValue({ data: ITEMS, error: null });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Home community filter", () => {
  it("defaults to All communities and shows every item", async () => {
    await renderHome();

    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.getByText("Hammer")).toBeTruthy();
  });

  it("lists the user's communities in the dropdown", async () => {
    await renderHome();

    await fireEvent.press(screen.getByLabelText("Choose community"));

    expect(screen.getByRole("button", { name: "All communities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Maple Street" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Oak Hall" })).toBeTruthy();
  });

  it("filters the grid to the picked community", async () => {
    await renderHome();

    await pickCommunity("Oak Hall");

    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
    expect(screen.queryByText("Hammer")).toBeNull();
  });

  it("goes back to every item when All communities is picked again", async () => {
    await renderHome();

    await pickCommunity("Oak Hall");
    await pickCommunity("All communities");

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
  });

  it("labels each card with its community only when All is selected", async () => {
    await renderHome();

    expect(screen.getAllByText("Maple Street")).toHaveLength(2);
    expect(screen.getAllByText("Oak Hall")).toHaveLength(1);

    await pickCommunity("Maple Street");

    // Only the dropdown shows the name now; the cards have no label.
    expect(screen.getAllByText("Maple Street")).toHaveLength(1);
    expect(screen.queryByText("Oak Hall")).toBeNull();
  });

  it("works together with search and the category tabs", async () => {
    await renderHome();

    await pickCommunity("Maple Street");
    await fireEvent.changeText(screen.getByPlaceholderText("Search items"), "ham");

    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();

    await fireEvent.press(screen.getByText("Outdoor"));

    expect(screen.getByText("No items found")).toBeTruthy();
  });

  it("saves the choice for the current user", async () => {
    await renderHome();

    await pickCommunity("Oak Hall");

    await waitFor(async () => {
      expect(await AsyncStorage.getItem("homeCommunityFilter:me")).toBe("c2");
    });
  });

  it("restores the remembered choice", async () => {
    await AsyncStorage.setItem("homeCommunityFilter:me", "c2");

    await renderHome("Tent");

    await waitFor(() => expect(screen.queryByText("Drill")).toBeNull());
    expect(screen.getByText("Oak Hall")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
  });

  it("does not use another user's remembered choice", async () => {
    await AsyncStorage.setItem("homeCommunityFilter:someone-else", "c2");

    await renderHome();

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith("homeCommunityFilter:me"));
    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
  });

  it("falls back to All when the saved community is no longer one of the user's", async () => {
    await AsyncStorage.setItem("homeCommunityFilter:me", "c-left");

    await renderHome();

    await waitFor(() => expect(AsyncStorage.getItem).toHaveBeenCalledWith("homeCommunityFilter:me"));
    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
  });

  it("falls back to All when the user leaves the remembered community", async () => {
    await AsyncStorage.setItem("homeCommunityFilter:me", "c2");
    await renderHome("Tent");
    await waitFor(() => expect(screen.queryByText("Drill")).toBeNull());

    mockCommunities = [{ id: "c1", name: "Maple Street" }];
    await screen.rerender(<Index />);

    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
  });

  it("still shows All when storage can't be read", async () => {
    mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error("storage broken"));

    await renderHome();

    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
  });
});

describe("Home categories", () => {
  it("uses the shared category list for the tabs", async () => {
    await renderHome();

    expect(screen.getByText("Popular")).toBeTruthy();
    for (const c of ITEM_CATEGORIES) {
      expect(screen.getByText(c)).toBeTruthy();
    }
    expect(screen.queryByText("School")).toBeNull();
    expect(screen.queryByText("Electronics")).toBeNull();
  });

  it("shows items with an unknown category under Other", async () => {
    mocked(api.items.getAll).mockResolvedValue({
      data: [...ITEMS, item("i9", "Mystery box", "c1", "Test")],
      error: null,
    });
    await renderHome();

    await fireEvent.press(screen.getByText("Other"));

    expect(screen.getByText("Mystery box")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });
});
