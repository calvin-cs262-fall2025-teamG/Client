import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import DiscoverScreen from "../app/(tabs)/search";
import * as api from "../services/supabase_api";
import { ITEM_CATEGORIES } from "../constants/categories";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getAll: jest.fn() },
  communities: { getAll: jest.fn() },
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

jest.mock("../context/BookmarksContext", () => ({
  useBookmarks: () => ({ byId: {}, isSaved: () => false, toggle: jest.fn() }),
}));

let mockMyCommunities: { id: string; name: string }[] = [];
const mockRequestToJoin = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({
    myCommunities: mockMyCommunities,
    requestToJoin: mockRequestToJoin,
  }),
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const T1 = "2026-10-19T12:00:00.123456+00:00";

const item = (id: string, name: string, community_id: string, category: string, status: string) => ({
  id,
  name,
  community_id,
  category,
  status,
  owner_id: "someone",
  description: null,
  image_path: null,
  return_date: null,
  created_at: T1,
  updated_at: T1,
});

const community = (id: string, name: string, description: string | null) => ({
  id,
  name,
  description,
  avatar_path: null,
  owner_id: "someone",
  created_at: T1,
  updated_at: T1,
});

const ITEMS = [
  item("i1", "Drill", "c1", "Tools", "available"),
  item("i2", "Tent", "c2", "Outdoor", "borrowed"),
  item("i3", "Hammer", "c1", "Tools", "borrowed"),
  item("i4", "Kettle", "c2", "Kitchen", "available"),
];

const COMMUNITIES = [
  community("c1", "Maple Street", "Our block"),
  community("c2", "Oak Hall", null),
  community("c3", "Pine Ridge", "Neighbors on the ridge"),
  community("c4", "Cedar Court", null),
];

async function renderSearch() {
  await render(<DiscoverScreen />);
  await screen.findByText("Drill");
}

async function openCommunitiesTab() {
  await fireEvent.press(screen.getByRole("tab", { name: "Communities" }));
}

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockMyCommunities = [
    { id: "c1", name: "Maple Street" },
    { id: "c2", name: "Oak Hall" },
  ];
  mockRequestToJoin.mockResolvedValue(undefined);
  mocked(api.items.getAll).mockImplementation(() => ok(ITEMS));
  mocked(api.communities.getAll).mockImplementation(() => ok(COMMUNITIES));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("Search tabs", () => {
  it("starts on the Items tab", async () => {
    await renderSearch();

    expect(screen.getByRole("tab", { name: "Items" }).props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByPlaceholderText("Search for anything")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Search communities")).toBeNull();
  });

  it("switches between Items and Communities", async () => {
    await renderSearch();

    await openCommunitiesTab();

    expect(screen.getByPlaceholderText("Search communities")).toBeTruthy();
    expect(screen.getByText("Pine Ridge")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();

    await fireEvent.press(screen.getByRole("tab", { name: "Items" }));

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.queryByText("Pine Ridge")).toBeNull();
  });
});

describe("Items filters", () => {
  it("shows every item by default", async () => {
    await renderSearch();

    for (const name of ["Drill", "Tent", "Hammer", "Kettle"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it("hides borrowed items when Available only is on", async () => {
    await renderSearch();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Kettle")).toBeTruthy();
    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.queryByText("Hammer")).toBeNull();

    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));

    expect(screen.getByText("Tent")).toBeTruthy();
  });

  it("filters by category", async () => {
    await renderSearch();

    await fireEvent.press(screen.getByRole("button", { name: "Tools" }));

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.queryByText("Kettle")).toBeNull();
  });

  it("filters by community", async () => {
    await renderSearch();

    await fireEvent.press(screen.getByRole("button", { name: "Oak Hall" }));

    expect(screen.getByText("Tent")).toBeTruthy();
    expect(screen.getByText("Kettle")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "All communities" }));

    expect(screen.getByText("Drill")).toBeTruthy();
  });

  it("combines search, category, community, and availability", async () => {
    await renderSearch();

    await fireEvent.press(screen.getByRole("button", { name: "Maple Street" }));
    await fireEvent.press(screen.getByRole("button", { name: "Tools" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.queryByText("Hammer")).toBeNull();

    await fireEvent.changeText(screen.getByPlaceholderText("Search for anything"), "ham");

    expect(screen.getByText("No items found")).toBeTruthy();
  });
});

describe("Communities tab", () => {
  it("lists only communities the user is not in, with name and description", async () => {
    await renderSearch();
    await openCommunitiesTab();

    expect(screen.getByText("Pine Ridge")).toBeTruthy();
    expect(screen.getByText("Neighbors on the ridge")).toBeTruthy();
    expect(screen.getByText("Cedar Court")).toBeTruthy();
    expect(screen.queryByText("Our block")).toBeNull();
    expect(screen.queryByRole("button", { name: "Request to join Maple Street" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Request to join Oak Hall" })).toBeNull();
  });

  it("filters communities with the search box", async () => {
    await renderSearch();
    await openCommunitiesTab();

    await fireEvent.changeText(screen.getByPlaceholderText("Search communities"), "ridge");

    expect(screen.getByText("Pine Ridge")).toBeTruthy();
    expect(screen.queryByText("Cedar Court")).toBeNull();
  });

  it("sends a join request and shows Requested", async () => {
    await renderSearch();
    await openCommunitiesTab();

    await fireEvent.press(screen.getByRole("button", { name: "Request to join Pine Ridge" }));

    expect(mockRequestToJoin).toHaveBeenCalledWith("c3");
    const button = await screen.findByRole("button", { name: "Requested to join Pine Ridge" });
    expect(screen.getByText("Requested")).toBeTruthy();
    expect(button.props.accessibilityState).toEqual({ disabled: true });
    expect(alertSpy).not.toHaveBeenCalled();

    // Other communities keep their own button.
    expect(screen.getByRole("button", { name: "Request to join Cedar Court" })).toBeTruthy();
  });

  it("does not send a second request once Requested", async () => {
    await renderSearch();
    await openCommunitiesTab();

    await fireEvent.press(screen.getByRole("button", { name: "Request to join Pine Ridge" }));
    const button = await screen.findByRole("button", { name: "Requested to join Pine Ridge" });
    await fireEvent.press(button);

    expect(mockRequestToJoin).toHaveBeenCalledTimes(1);
  });

  it("alerts and keeps the button when the request fails", async () => {
    mockRequestToJoin.mockRejectedValueOnce(new Error("Not authenticated"));
    await renderSearch();
    await openCommunitiesTab();

    await fireEvent.press(screen.getByRole("button", { name: "Request to join Pine Ridge" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Couldn't send request", "Not authenticated")
    );
    const button = screen.getByRole("button", { name: "Request to join Pine Ridge" });
    expect(button.props.accessibilityState).toEqual({ disabled: false });
    expect(screen.queryByText("Requested")).toBeNull();
  });

  it("shows the empty state when the user is already in every community", async () => {
    mocked(api.communities.getAll).mockImplementation(() => ok(COMMUNITIES.slice(0, 2)));
    await renderSearch();
    await openCommunitiesTab();

    expect(screen.getByText("No communities to join yet.")).toBeTruthy();
  });

  it("shows the empty state when there are no communities", async () => {
    mocked(api.communities.getAll).mockImplementation(() => ok([]));
    await renderSearch();
    await openCommunitiesTab();

    expect(screen.getByText("No communities to join yet.")).toBeTruthy();
  });

  it("shows the empty state when communities fail to load", async () => {
    mocked(api.communities.getAll).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "boom" } })
    );
    await renderSearch();
    await openCommunitiesTab();

    expect(screen.getByText("No communities to join yet.")).toBeTruthy();
  });
});

describe("Search categories", () => {
  it("uses the shared category list for the chips", async () => {
    await renderSearch();

    expect(screen.getByRole("button", { name: "All" })).toBeTruthy();
    for (const c of ITEM_CATEGORIES) {
      expect(screen.getByRole("button", { name: c })).toBeTruthy();
    }
  });

  it("shows items with an unknown category under Other", async () => {
    mocked(api.items.getAll).mockImplementation(() =>
      ok([...ITEMS, item("i9", "Mystery box", "c1", "Test", "available")])
    );
    await renderSearch();

    await fireEvent.press(screen.getByRole("button", { name: "Other" }));

    expect(screen.getByText("Mystery box")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });
});
