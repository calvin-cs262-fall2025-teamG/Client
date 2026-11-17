import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, render, screen, fireEvent, waitFor, userEvent } from "@testing-library/react-native";
import Index from "../app/(tabs)/index";
import * as api from "../services/supabase_api";
import { ITEM_CATEGORIES } from "../constants/categories";
import { clearItemCommunities } from "../hooks/useItemCommunities";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn(), replace: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getAll: jest.fn(), getCommunityIds: jest.fn() },
}));

let mockUserId: string | null = "me";
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUserId ? { id: mockUserId } : null }),
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

const item = (id: string, name: string, category: string) => ({
  id,
  name,
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
  item("i1", "Drill", "Tools"),
  item("i2", "Tent", "Outdoor"),
  item("i3", "Hammer", "Tools"),
];

// What items.getCommunityIds returns for each item.
let communityIds: Record<string, string[]> = {};

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
  communityIds = { i1: ["c1"], i2: ["c2"], i3: ["c1"], i9: ["c1"] };
  mocked(api.items.getCommunityIds).mockImplementation(async (id: string) => ({
    data: communityIds[id] ?? [],
    error: null,
  }));
  clearItemCommunities();
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

    expect(await screen.findByText("Tent")).toBeTruthy();
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

    await waitFor(() => expect(screen.getAllByText("Maple Street")).toHaveLength(2));
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

    expect(await screen.findByText("Hammer")).toBeTruthy();
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

    mockCommunities = [
      { id: "c1", name: "Maple Street" },
      { id: "c3", name: "Pine Ridge" },
    ];
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
      data: [...ITEMS, item("i9", "Mystery box", "Test")],
      error: null,
    });
    await renderHome();

    await fireEvent.press(screen.getByText("Other"));

    expect(screen.getByText("Mystery box")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });
});

describe("Home header", () => {
  it("shows a single community without a caret, and it can't be tapped", async () => {
    mockCommunities = [{ id: "c1", name: "Maple Street" }];
    await renderHome();

    expect(screen.getByText("YOUR COMMUNITY")).toBeTruthy();
    expect(screen.getByTestId("community-switcher")).toBeTruthy();
    expect(screen.getByText("Maple Street")).toBeTruthy();
    expect(screen.queryByTestId("community-switcher-caret")).toBeNull();
    expect(screen.queryByLabelText("Choose community")).toBeNull();
  });

  it("shows All communities with a caret when several communities and All is selected", async () => {
    await renderHome();

    expect(screen.getByText("YOUR COMMUNITIES")).toBeTruthy();
    expect(screen.getByText("All communities")).toBeTruthy();
    expect(screen.getByTestId("community-switcher-caret")).toBeTruthy();
  });

  it("shows the picked community with a caret when several communities", async () => {
    await renderHome();

    await pickCommunity("Oak Hall");

    expect(screen.getByText("YOUR COMMUNITY")).toBeTruthy();
    expect(screen.queryByText("YOUR COMMUNITIES")).toBeNull();
    expect(screen.getByText("Oak Hall")).toBeTruthy();
    expect(screen.getByTestId("community-switcher-caret")).toBeTruthy();
  });

  it("opens the community picker from the box", async () => {
    await renderHome();

    await fireEvent.press(screen.getByLabelText("Choose community"));

    expect(screen.getByRole("button", { name: "All communities" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Oak Hall" })).toBeTruthy();
  });

  it("no longer shows the separate All communities pill", async () => {
    await renderHome();

    // Only the header box says "All communities"; there's no extra pill.
    expect(screen.getAllByText("All communities")).toHaveLength(1);
  });

  it("opens Bookmarks from the bookmark icon", async () => {
    await renderHome();

    await fireEvent.press(screen.getByLabelText("Open bookmarks"));

    expect(mockRouter.push).toHaveBeenCalledWith("/bookmark");
  });
});

describe("Home community label rule", () => {
  it("labels cards when All is selected and the user is in 2+ communities", async () => {
    await renderHome();

    await waitFor(() => expect(screen.getAllByText("Maple Street")).toHaveLength(2));
    expect(screen.getByText("Oak Hall")).toBeTruthy();
  });

  it("hides labels when a single community is picked", async () => {
    await renderHome();

    await pickCommunity("Oak Hall");

    // Only the header shows the name.
    expect(screen.getAllByText("Oak Hall")).toHaveLength(1);
    expect(screen.queryByText("Maple Street")).toBeNull();
  });

  it("hides labels for a user in only one community", async () => {
    mockCommunities = [{ id: "c1", name: "Maple Street" }];
    await renderHome();

    // Only the header shows the name.
    expect(screen.getAllByText("Maple Street")).toHaveLength(1);
    // No labels and All shown, so there is nothing to look up.
    expect(api.items.getCommunityIds).not.toHaveBeenCalled();
  });

  it("names the first of the user's communities and counts the rest", async () => {
    communityIds = { i1: ["c1", "c2"], i2: ["c9", "c2"], i3: ["c9", "c2", "c1"] };
    await renderHome();

    expect(await screen.findByText("Maple Street +1")).toBeTruthy();
    // c9 isn't one of the user's communities, so it is skipped and not counted.
    expect(screen.getByText("Oak Hall")).toBeTruthy();
    expect(screen.getByText("Oak Hall +1")).toBeTruthy();
  });

  it("shows no label while an item's communities are loading or after a failed lookup", async () => {
    mocked(api.items.getCommunityIds).mockImplementation(async (id: string) =>
      id === "i2"
        ? { data: null, error: { message: "boom" } }
        : { data: communityIds[id], error: null }
    );
    await renderHome();

    await waitFor(() => expect(screen.getAllByText("Maple Street")).toHaveLength(2));
    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.queryByText("Oak Hall")).toBeNull();
  });
});

describe("Home item communities", () => {
  it("shows every item under All before their communities load", async () => {
    mocked(api.items.getCommunityIds).mockReturnValue(new Promise(() => {}));
    await renderHome();

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.getByText("Hammer")).toBeTruthy();
  });

  it("hides items under a picked community until their communities load", async () => {
    const resolvers: Record<string, () => void> = {};
    mocked(api.items.getCommunityIds).mockImplementation(
      (id: string) =>
        new Promise((resolve) => {
          resolvers[id] = () => resolve({ data: communityIds[id], error: null });
        })
    );
    await renderHome();

    await pickCommunity("Oak Hall");

    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.queryByText("No items found")).toBeNull();
    expect(screen.getByTestId("item-communities-loading")).toBeTruthy();

    await act(async () => resolvers.i2());

    expect(await screen.findByText("Tent")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });

  it("hides an item under a picked community when its lookup fails", async () => {
    mocked(api.items.getCommunityIds).mockImplementation(async (id: string) =>
      id === "i2" ? Promise.reject(new Error("network down")) : { data: communityIds[id], error: null }
    );
    await renderHome();

    await pickCommunity("Oak Hall");

    expect(await screen.findByText("No items found")).toBeTruthy();
    expect(screen.queryByText("Tent")).toBeNull();
  });

  it("looks the communities up again on pull to refresh", async () => {
    await renderHome();
    await waitFor(() => expect(api.items.getCommunityIds).toHaveBeenCalledTimes(3));

    communityIds = { ...communityIds, i1: ["c2"] };
    await userEvent.setup().pullToRefresh(screen.getByTestId("home-items"));

    await waitFor(() => expect(api.items.getCommunityIds).toHaveBeenCalledTimes(6));
    await waitFor(() => expect(screen.getAllByText("Oak Hall")).toHaveLength(2));
  });

  it("keeps a picked community's items visible while refreshing", async () => {
    await renderHome();
    await pickCommunity("Oak Hall");
    await screen.findByText("Tent");
    mocked(api.items.getCommunityIds).mockReturnValue(new Promise(() => {}));

    await userEvent.setup().pullToRefresh(screen.getByTestId("home-items"));

    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.queryByTestId("item-communities-loading")).toBeNull();
  });
});
