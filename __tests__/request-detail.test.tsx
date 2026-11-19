import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react-native";
import RequestDetail from "../app/request/[id]";
import * as api from "../services/supabase_api";
import { formatDate } from "../services/borrowingStatus";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

let mockParams: Record<string, string> = {};
const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

// Mutable so each test sets the request's state; functions keep one identity
let mockBorrowing: Record<string, unknown[]> = {};
const mockRefresh = jest.fn(() => Promise.resolve());
jest.mock("../context/BorrowingContext", () => ({
  useBorrowing: () => ({ ...mockBorrowing, refresh: mockRefresh }),
}));
let mockMyItems: unknown[] = [];
jest.mock("../context/ItemsContext", () => ({
  useItems: () => ({ myItems: mockMyItems }),
}));
const mockGetProfile = jest.fn(() => Promise.resolve(null));
jest.mock("../context/ProfileContext", () => ({
  useProfile: () => ({
    profilesById: {
      u2: { id: "u2", display_name: "Jamie", avatar_path: null },
      u3: { id: "u3", display_name: "Riley", avatar_path: null },
    },
    getProfile: mockGetProfile,
  }),
}));
let mockCommunities: unknown[] = [];
jest.mock("../context/CommunityContext", () => ({
  useCommunities: () => ({ myCommunities: mockCommunities }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getById: jest.fn(), getCommunityIds: jest.fn() },
  communities: { getById: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const REQUESTED = "2026-10-19T12:00:00.123456+00:00";
const DECIDED = "2026-10-20T09:30:00.654321+00:00";
const RETURNED = "2026-10-26T17:00:00.000000+00:00";

const tent = (owner_id = "u2") => ({
  id: "tent",
  name: "Tent",
  owner_id,
  status: "available",
  description: null,
  category: "Outdoors",
  image_path: null,
  return_date: null,
  created_at: REQUESTED,
  updated_at: REQUESTED,
});

const request = (status: string, requester_id = "me") => ({
  id: "r1",
  item_id: "tent",
  requester_id,
  status,
  requested_at: REQUESTED,
  decided_at: status === "pending" ? null : DECIDED,
});

const stepText = (key: string) =>
  within(screen.getByTestId(`step-${key}`))
    .getAllByText(/.*/)
    .map((n) => n.props.children)
    .filter((c) => typeof c === "string");

const renderAs = async (status: string, returned_at: string | null = null) => {
  mockBorrowing.myRequests = [request(status)];
  if (status === "approved") {
    mockBorrowing.borrowingHistory = [
      { id: "h1", request_id: "r1", borrowed_at: DECIDED, returned_at },
    ];
  }
  await render(<RequestDetail />);
  await screen.findByText("Tent");
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockParams = { id: "r1" };
  mockBorrowing = { myRequests: [], incomingRequests: [], borrowingHistory: [] };
  mockMyItems = [];
  mockCommunities = [{ id: "c1", name: "Maple Street" }];
  mocked(api.items.getById).mockImplementation(() => ok(tent()));
  mocked(api.items.getCommunityIds).mockImplementation(() => ok(["c1"]));
  mocked(api.communities.getById).mockImplementation(() =>
    ok({ id: "c9", name: "Oak Hall" })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("shows the item card with the lender and community, and refreshes", async () => {
  await renderAs("pending");

  expect(screen.getByText("From Jamie")).toBeTruthy();
  expect(await screen.findByText("Maple Street")).toBeTruthy();
  expect(api.items.getById).toHaveBeenCalledWith("tent");
  expect(mockGetProfile).toHaveBeenCalledWith("u2");
  expect(mockRefresh).toHaveBeenCalled();
  expect(api.communities.getById).not.toHaveBeenCalled();
});

it("looks up the community by id when it isn't one of yours", async () => {
  mocked(api.items.getCommunityIds).mockImplementation(() => ok(["c9"]));
  await renderAs("pending");

  expect(await screen.findByText("Oak Hall")).toBeTruthy();
  expect(api.communities.getById).toHaveBeenCalledWith("c9");
});

it("pending: shows a waiting status line and no banner", async () => {
  await renderAs("pending");

  expect(screen.getByText("Waiting for Jamie to respond")).toBeTruthy();
  expect(screen.queryByTestId("approved-banner")).toBeNull();
  expect(screen.queryByText("Next: arrange pickup")).toBeNull();
  expect(stepText("requested")).toEqual(["Requested", formatDate(REQUESTED)]);
  expect(stepText("approved")).toEqual(["Approved", "Waiting for Jamie"]);
  expect(stepText("returned")).toEqual(["Returned", "Jamie marks this"]);
});

it("approved: shows the green banner, next step, and the approval date", async () => {
  await renderAs("approved");

  expect(screen.getByText("Jamie said yes!")).toBeTruthy();
  expect(screen.queryByTestId("status-line")).toBeNull();
  expect(screen.getByText("Next: arrange pickup")).toBeTruthy();
  expect(stepText("approved")).toEqual(["Approved", formatDate(DECIDED)]);
  expect(stepText("returned")).toEqual(["Returned", "Jamie marks this"]);
  expect(
    screen.getByText(
      "Hey, Neighbor! doesn't cover damage or loss. Talk with Jamie about how to handle anything that comes up."
    )
  ).toBeTruthy();
});

it("declined: shows a declined status line and no Returned step", async () => {
  await renderAs("declined");

  expect(screen.getByText("Jamie declined this request")).toBeTruthy();
  expect(screen.queryByTestId("approved-banner")).toBeNull();
  expect(stepText("decided")).toEqual(["Declined", formatDate(DECIDED)]);
  expect(screen.queryByTestId("step-returned")).toBeNull();
});

it("cancelled: says you cancelled it", async () => {
  await renderAs("cancelled");

  expect(screen.getByText("You cancelled this request")).toBeTruthy();
  expect(stepText("decided")[0]).toBe("Cancelled");
});

it("returned: shows when it came back", async () => {
  await renderAs("approved", RETURNED);

  expect(screen.getByText(`Returned ${formatDate(RETURNED)}`)).toBeTruthy();
  expect(screen.queryByTestId("approved-banner")).toBeNull();
  expect(screen.queryByText("Next: arrange pickup")).toBeNull();
  expect(stepText("returned")).toEqual(["Returned", formatDate(RETURNED)]);
});

it("Message opens the DM thread with the lender about this item", async () => {
  await renderAs("approved");

  await fireEvent.press(screen.getByText("Message Jamie"));

  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: "/chat-thread",
    params: { id: "u2", name: "Jamie", itemId: "tent" },
  });
});

it("still offers Message when the request is pending", async () => {
  await renderAs("pending");

  expect(screen.getByText("Message Jamie")).toBeTruthy();
});

it("for the lender, messages the borrower and speaks to you", async () => {
  mockMyItems = [tent("me")];
  mockBorrowing.incomingRequests = [request("approved", "u3")];
  mockBorrowing.borrowingHistory = [
    { id: "h1", request_id: "r1", borrowed_at: DECIDED, returned_at: null },
  ];
  await render(<RequestDetail />);

  expect(screen.getByText("You said yes!")).toBeTruthy();
  expect(screen.getByText("Your item")).toBeTruthy();
  expect(api.items.getById).not.toHaveBeenCalled();

  await fireEvent.press(screen.getByText("Message Riley"));
  expect(mockRouter.push).toHaveBeenCalledWith({
    pathname: "/chat-thread",
    params: { id: "u3", name: "Riley", itemId: "tent" },
  });
});

it("says so when the request can't be found", async () => {
  mockParams = { id: "missing" };
  await render(<RequestDetail />);

  expect(await screen.findByText("We couldn't find this request.")).toBeTruthy();
});
