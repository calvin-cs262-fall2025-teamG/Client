import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react-native";
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

// Day n of October 2026, in the format PostgREST returns.
const day = (n: number) => `2026-10-${String(n).padStart(2, "0")}T12:00:00.123456+00:00`;

const item = (
  id: string,
  name: string,
  community_id: string,
  category: string,
  status: string,
  created = 1
) => ({
  id,
  name,
  community_id,
  category,
  status,
  owner_id: "someone",
  description: null,
  image_path: null,
  return_date: null,
  created_at: day(created),
  updated_at: day(created),
});

const community = (id: string, name: string, description: string | null) => ({
  id,
  name,
  description,
  avatar_path: null,
  owner_id: "someone",
  created_at: day(1),
  updated_at: day(1),
});

const ITEMS = [
  item("i1", "Drill", "c1", "Tools", "available", 1),
  item("i2", "Tent", "c2", "Outdoor", "borrowed", 2),
  item("i3", "Hammer", "c1", "Tools", "borrowed", 3),
  item("i4", "Kettle", "c2", "Kitchen", "available", 4),
];

const COMMUNITIES = [
  community("c1", "Maple Street", "Our block"),
  community("c2", "Oak Hall", null),
  community("c3", "Pine Ridge", "Neighbors on the ridge"),
  community("c4", "Cedar Court", null),
];

async function renderDiscover() {
  await render(<DiscoverScreen />);
  await screen.findByText("Browse by category");
  await waitFor(() => expect(api.communities.getAll).toHaveBeenCalled());
  await waitFor(() => expect(api.items.getAll).toHaveBeenCalled());
}

async function search(text: string) {
  await fireEvent.changeText(screen.getByPlaceholderText("Search items or communities"), text);
}

async function openFilters() {
  await fireEvent.press(screen.getByRole("button", { name: "Filters" }));
}

async function showResults() {
  await fireEvent.press(screen.getByRole("button", { name: "Show results" }));
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

describe("Discover default screen", () => {
  it("shows the title, search bar and every section", async () => {
    await renderDiscover();

    expect(screen.getByText("Discover")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search items or communities")).toBeTruthy();
    expect(await screen.findByText("Communities to join")).toBeTruthy();
    expect(screen.getByText("Browse by category")).toBeTruthy();
    expect(await screen.findByText("New in your communities")).toBeTruthy();
  });

  it("has no Items | Communities toggle or Filters button", async () => {
    await renderDiscover();

    expect(screen.queryByRole("tab", { name: "Items" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Communities" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Filters" })).toBeNull();
  });
});

describe("Communities to join", () => {
  it("lists only communities the user is not in", async () => {
    await renderDiscover();

    expect(await screen.findByText("Pine Ridge")).toBeTruthy();
    expect(screen.getByText("Neighbors on the ridge")).toBeTruthy();
    expect(screen.getByText("Cedar Court")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Request to join Maple Street" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Request to join Oak Hall" })).toBeNull();
  });

  it("is hidden when the user is already in every community", async () => {
    mocked(api.communities.getAll).mockImplementation(() => ok(COMMUNITIES.slice(0, 2)));
    await renderDiscover();

    expect(screen.queryByText("Communities to join")).toBeNull();
    expect(screen.queryByText("See all")).toBeNull();
  });

  it("is hidden when there are no communities", async () => {
    mocked(api.communities.getAll).mockImplementation(() => ok([]));
    await renderDiscover();

    expect(screen.queryByText("Communities to join")).toBeNull();
  });

  it("is hidden when communities fail to load", async () => {
    mocked(api.communities.getAll).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "boom" } })
    );
    await renderDiscover();

    expect(screen.queryByText("Communities to join")).toBeNull();
  });

  it("sends a join request from a card and shows Requested", async () => {
    await renderDiscover();

    await fireEvent.press(await screen.findByRole("button", { name: "Request to join Pine Ridge" }));

    expect(mockRequestToJoin).toHaveBeenCalledWith("c3");
    const button = await screen.findByRole("button", { name: "Requested to join Pine Ridge" });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
    expect(within(button).getByText("Requested")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Request to join Cedar Court" })).toBeTruthy();

    await fireEvent.press(button);
    expect(mockRequestToJoin).toHaveBeenCalledTimes(1);
  });

  it("alerts and keeps the button when the request fails", async () => {
    mockRequestToJoin.mockRejectedValueOnce(new Error("Not authenticated"));
    await renderDiscover();

    await fireEvent.press(await screen.findByRole("button", { name: "Request to join Pine Ridge" }));

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith("Couldn't send request", "Not authenticated")
    );
    expect(
      screen.getByRole("button", { name: "Request to join Pine Ridge" }).props.accessibilityState
    ).toEqual({ disabled: false });
  });

  it("opens the full list from See all and goes back", async () => {
    await renderDiscover();

    await fireEvent.press(await screen.findByText("See all"));

    expect(screen.queryByText("Browse by category")).toBeNull();
    expect(screen.getByRole("button", { name: "Request to join Pine Ridge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Request to join Cedar Court" })).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Back to Discover"));

    expect(screen.getByText("Browse by category")).toBeTruthy();
  });

  it("keeps Requested between the cards and the full list", async () => {
    await renderDiscover();

    await fireEvent.press(await screen.findByRole("button", { name: "Request to join Pine Ridge" }));
    await screen.findByRole("button", { name: "Requested to join Pine Ridge" });
    await fireEvent.press(screen.getByText("See all"));

    expect(screen.getByRole("button", { name: "Requested to join Pine Ridge" })).toBeTruthy();
  });
});

describe("Browse by category", () => {
  it("shows a tile for every shared category", async () => {
    await renderDiscover();

    for (const c of ITEM_CATEGORIES) {
      expect(screen.getByRole("button", { name: `Browse ${c}` })).toBeTruthy();
    }
  });

  it("shows that category's items when a tile is tapped", async () => {
    await renderDiscover();
    await screen.findByText("New in your communities");

    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    expect(screen.queryByText("Browse by category")).toBeNull();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.queryByText("Kettle")).toBeNull();
  });

  it("groups unknown categories under Other", async () => {
    mocked(api.items.getAll).mockImplementation(() =>
      ok([...ITEMS, item("i9", "Mystery box", "c1", "Test", "available", 5)])
    );
    await renderDiscover();
    await screen.findByText("New in your communities");

    await fireEvent.press(screen.getByRole("button", { name: "Browse Other" }));

    expect(screen.getByText("Mystery box")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });

  it("goes back to the default screen when the category is cleared", async () => {
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    await fireEvent.press(screen.getByRole("button", { name: "Clear Tools filter" }));

    expect(screen.getByText("Browse by category")).toBeTruthy();
  });
});

describe("New in your communities", () => {
  it("shows the 5 newest items from the user's communities, newest first", async () => {
    mocked(api.items.getAll).mockImplementation(() =>
      ok([
        ...ITEMS,
        item("i5", "Ladder", "c1", "Tools", "available", 5),
        item("i6", "Wok", "c2", "Kitchen", "available", 6),
        item("i7", "Elsewhere", "c9", "Other", "available", 9),
      ])
    );
    await renderDiscover();
    await screen.findByText("New in your communities");

    const rendered = screen
      .getAllByText(/^(Wok|Ladder|Kettle|Hammer|Tent|Drill|Elsewhere)$/)
      .map((n) => n.props.children);
    expect(rendered).toEqual(["Wok", "Ladder", "Kettle", "Hammer", "Tent"]);
  });

  it("shows the community name on each row and opens the item when tapped", async () => {
    await renderDiscover();
    await screen.findByText("New in your communities");

    expect(screen.getAllByText("Oak Hall").length).toBe(2);
    await fireEvent.press(screen.getByText("Kettle"));

    expect(mockRouter.push).toHaveBeenCalledWith("/item/i4");
  });

  it("has a bookmark on each row", async () => {
    await renderDiscover();
    await screen.findByText("New in your communities");

    expect(screen.getByLabelText("Bookmark Kettle")).toBeTruthy();
  });
});

describe("Searching", () => {
  it("replaces the sections with results while typing", async () => {
    await renderDiscover();

    await search("dri");

    expect(screen.queryByText("Browse by category")).toBeNull();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.queryByText("Kettle")).toBeNull();
  });

  it("returns to the default screen when the search is cleared", async () => {
    await renderDiscover();
    await search("dri");

    await fireEvent.press(screen.getByLabelText("Clear search"));

    expect(screen.getByText("Browse by category")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search items or communities").props.value).toBe("");
  });

  it("returns to the default screen when the text is deleted", async () => {
    await renderDiscover();
    await search("dri");

    await search("  ");

    expect(screen.getByText("Browse by category")).toBeTruthy();
  });
});

describe("Filters", () => {
  it("hides borrowed items with Available only and counts it in the badge", async () => {
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));
    expect(screen.queryByTestId("filters-badge")).toBeNull();

    await openFilters();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));
    await showResults();

    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.queryByText("Hammer")).toBeNull();
    expect(screen.getByTestId("filters-badge")).toHaveTextContent("1");
  });

  it("filters by community and counts both filters", async () => {
    await renderDiscover();
    await search("e");

    await openFilters();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));
    await fireEvent.press(screen.getByRole("button", { name: "Oak Hall" }));
    await showResults();

    expect(screen.getByText("Kettle")).toBeTruthy();
    expect(screen.queryByText("Tent")).toBeNull();
    expect(screen.getByTestId("filters-badge")).toHaveTextContent("2");
  });

  it("clears every filter with Clear all", async () => {
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));
    await openFilters();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));
    await showResults();

    await openFilters();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    await showResults();

    expect(screen.queryByTestId("filters-badge")).toBeNull();
    expect(screen.getByText("Hammer")).toBeTruthy();
  });

  it("does not apply changes when the sheet is closed without Show results", async () => {
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    await openFilters();
    await fireEvent.press(screen.getByRole("checkbox", { name: "Available only" }));
    await fireEvent.press(screen.getByLabelText("Close filters"));

    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByTestId("filters-badge")).toBeNull();
  });

  it("hides the community filter for a user in one community", async () => {
    mockMyCommunities = [{ id: "c1", name: "Maple Street" }];
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    await openFilters();

    expect(screen.getByRole("checkbox", { name: "Available only" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "All communities" })).toBeNull();
  });
});

describe("Grouped results", () => {
  const tab = (name: string | RegExp) => screen.getByRole("tab", { name });

  it("shows All, Items (n) and Communities (n) tabs with All selected", async () => {
    await renderDiscover();

    await search("r");

    // Items: Drill, Hammer. Communities: Pine Ridge, Cedar Court (not Maple Street, a member).
    expect(tab("All").props.accessibilityState).toEqual({ selected: true });
    expect(tab("Items (2)")).toBeTruthy();
    expect(tab("Communities (2)")).toBeTruthy();
  });

  it("updates the counts as the search changes", async () => {
    await renderDiscover();

    await search("pine");

    expect(tab("Items (0)")).toBeTruthy();
    expect(tab("Communities (1)")).toBeTruthy();
  });

  it("groups items with status tags and communities with Request buttons on All", async () => {
    await renderDiscover();

    await search("r");

    expect(screen.getByText("Items")).toBeTruthy();
    expect(screen.getByText("Communities")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Available")).toBeTruthy();
    expect(screen.getByText("Borrowed")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Request to join Pine Ridge" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Request to join Cedar Court" })).toBeTruthy();
  });

  it("shows only items on the Items tab", async () => {
    await renderDiscover();
    await search("r");

    await fireEvent.press(tab("Items (2)"));

    expect(tab("Items (2)").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Request to join Pine Ridge" })).toBeNull();
  });

  it("shows only communities on the Communities tab", async () => {
    await renderDiscover();
    await search("r");

    await fireEvent.press(tab("Communities (2)"));

    expect(screen.getByRole("button", { name: "Request to join Pine Ridge" })).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });

  it("sends a join request from the results", async () => {
    await renderDiscover();
    await search("pine");

    await fireEvent.press(screen.getByRole("button", { name: "Request to join Pine Ridge" }));

    expect(mockRequestToJoin).toHaveBeenCalledWith("c3");
    const button = await screen.findByRole("button", { name: "Requested to join Pine Ridge" });
    expect(button.props.accessibilityState).toEqual({ disabled: true });
  });

  it("keeps Requested from the default screen in the results", async () => {
    await renderDiscover();
    await fireEvent.press(await screen.findByRole("button", { name: "Request to join Pine Ridge" }));
    await screen.findByRole("button", { name: "Requested to join Pine Ridge" });

    await search("pine");

    expect(screen.getByRole("button", { name: "Requested to join Pine Ridge" })).toBeTruthy();
  });

  it("shows a no-results message", async () => {
    await renderDiscover();

    await search("zzz");

    expect(screen.getByText('No results for "zzz"')).toBeTruthy();
  });

  it("uses the same results view for a category tile, with a way to clear it", async () => {
    await renderDiscover();
    await screen.findByText("New in your communities");

    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    expect(tab("Items (2)")).toBeTruthy();
    expect(tab("Communities (0)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Filters" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Clear Tools filter" })).toBeTruthy();
  });

  it("filters typed results by the picked category", async () => {
    await renderDiscover();
    await fireEvent.press(screen.getByRole("button", { name: "Browse Tools" }));

    await search("ham");

    expect(tab("Items (1)")).toBeTruthy();
    expect(screen.getByText("Hammer")).toBeTruthy();
    expect(screen.queryByText("Drill")).toBeNull();
  });

  it("starts on All again after the search is cleared", async () => {
    await renderDiscover();
    await search("r");
    await fireEvent.press(tab("Communities (2)"));

    await fireEvent.press(screen.getByLabelText("Clear search"));
    expect(screen.getByText("Browse by category")).toBeTruthy();

    await search("r");
    expect(tab("All").props.accessibilityState).toEqual({ selected: true });
  });
});
