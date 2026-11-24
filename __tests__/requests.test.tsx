import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import Requests from "../app/requests";
import * as api from "../services/supabase_service";
import { confirm, notify } from "../utils/confirm";
import { formatDate } from "../services/borrowingStatus";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_service", () => ({
  items: { getById: jest.fn() },
}));

jest.mock("../utils/confirm", () => ({
  confirm: jest.fn(),
  notify: jest.fn(() => Promise.resolve()),
}));

// Mutable so tests can set up each section; functions keep one identity across renders
let mockBorrowing: Record<string, unknown[]> = {};
let mockMyItems: unknown[] = [];
const mockActions = {
  refresh: jest.fn(() => Promise.resolve()),
  approveRequest: jest.fn(() => Promise.resolve()),
  declineRequest: jest.fn(() => Promise.resolve()),
  cancelRequest: jest.fn(() => Promise.resolve()),
  markReturned: jest.fn(() => Promise.resolve()),
};
const mockGetProfile = jest.fn(() => Promise.resolve(null));
jest.mock("../context/BorrowingContext", () => ({
  useBorrowing: () => ({ ...mockBorrowing, ...mockActions }),
}));
jest.mock("../context/ItemsContext", () => ({
  useItems: () => ({ myItems: mockMyItems }),
}));
jest.mock("../context/ProfileContext", () => ({
  useProfile: () => ({
    profilesById: { u2: { id: "u2", display_name: "Jamie", avatar_path: null } },
    getProfile: mockGetProfile,
  }),
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const T1 = "2026-10-19T12:00:00.123456+00:00";
const T2 = "2026-10-20T09:30:00.654321+00:00";
const T3 = "2026-10-24T17:00:00.000000+00:00";

const item = (id: string, name: string, status = "available") => ({
  id,
  name,
  status,
  owner_id: "me",
  description: null,
  category: "Tools",
  image_path: null,
  return_date: null,
  created_at: T1,
  updated_at: T1,
});

const request = (id: string, item_id: string, requester_id: string, status: string) => ({
  id,
  item_id,
  requester_id,
  status,
  requested_at: T1,
  decided_at: status === "pending" ? null : T2,
});

const showAskedFor = () => fireEvent.press(screen.getByRole("tab", { name: "I asked for" }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockBorrowing = { myRequests: [], incomingRequests: [], borrowingHistory: [] };
  mockMyItems = [];
  mocked(api.items.getById).mockImplementation((id: string) =>
    ok(item(id, id === "their-tent" ? "Tent" : "Ladder"))
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("shows the two tabs, starting on For my items, and refreshes", async () => {
  await render(<Requests />);

  expect(screen.getByRole("tab", { name: "For my items" }).props.accessibilityState).toEqual({
    selected: true,
  });
  expect(screen.getByRole("tab", { name: "I asked for" }).props.accessibilityState).toEqual({
    selected: false,
  });
  expect(screen.getByText("No requests for your items")).toBeTruthy();
  expect(mockActions.refresh).toHaveBeenCalled();

  await showAskedFor();
  expect(screen.getByText("You haven’t asked for anything")).toBeTruthy();
});

describe("Waiting for you", () => {
  beforeEach(() => {
    mockMyItems = [item("drill", "Drill")];
    mockBorrowing.incomingRequests = [request("r1", "drill", "u2", "pending")];
  });

  it("shows the item and who is asking", async () => {
    await render(<Requests />);

    expect(screen.getByText("Waiting for you")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText(`Jamie wants to borrow this · ${formatDate(T1)}`)).toBeTruthy();
    expect(mockGetProfile).toHaveBeenCalledWith("u2");
    expect(screen.queryByText("Lent out")).toBeNull();
  });

  it("Approve calls approveRequest and then shows the Mark returned hint", async () => {
    await render(<Requests />);
    expect(screen.queryByTestId("return-hint")).toBeNull();

    await fireEvent.press(screen.getByText("Approve"));

    expect(mockActions.approveRequest).toHaveBeenCalledWith("r1");
    expect(mockActions.declineRequest).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Once it’s back, tap Mark returned so neighbors can borrow it again.")
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Dismiss tip"));
    expect(screen.queryByTestId("return-hint")).toBeNull();
  });

  it("Decline calls declineRequest and shows no hint", async () => {
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Decline"));

    expect(mockActions.declineRequest).toHaveBeenCalledWith("r1");
    expect(mockActions.approveRequest).not.toHaveBeenCalled();
    expect(screen.queryByTestId("return-hint")).toBeNull();
  });

  it("shows an error when approving fails, with no hint, and lets you try again", async () => {
    mockActions.approveRequest.mockRejectedValueOnce(new Error("Pending request not found"));
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Approve"));
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        "Something went wrong",
        "Could not approve the request. Please try again."
      )
    );
    expect(screen.queryByTestId("return-hint")).toBeNull();

    await fireEvent.press(screen.getByText("Approve"));
    expect(mockActions.approveRequest).toHaveBeenCalledTimes(2);
  });

  it("leaves out decided requests", async () => {
    mockBorrowing.incomingRequests = [request("r1", "drill", "u2", "declined")];
    await render(<Requests />);

    expect(screen.queryByText("Waiting for you")).toBeNull();
    expect(screen.queryByText("Approve")).toBeNull();
  });
});

describe("Lent out", () => {
  beforeEach(() => {
    mockMyItems = [item("drill", "Drill", "borrowed")];
    mockBorrowing.incomingRequests = [request("r1", "drill", "u2", "approved")];
    mockBorrowing.borrowingHistory = [
      { id: "h1", request_id: "r1", borrowed_at: T2, returned_at: null },
    ];
  });

  it("shows who has it, since when, and a Borrowed tag", async () => {
    await render(<Requests />);

    expect(screen.getByText("Lent out")).toBeTruthy();
    expect(screen.getByText("Borrowed")).toBeTruthy();
    expect(screen.getByText(`With Jamie since ${formatDate(T2)}`)).toBeTruthy();
    expect(screen.queryByText("Waiting for you")).toBeNull();
  });

  it("lists Lent out above Waiting for you", async () => {
    mockMyItems = [item("drill", "Drill", "borrowed"), item("saw", "Saw")];
    mockBorrowing.incomingRequests = [
      request("r1", "drill", "u2", "approved"),
      request("r2", "saw", "u2", "pending"),
    ];
    await render(<Requests />);

    const titles = screen
      .getAllByText(/^(Lent out|Waiting for you)$/)
      .map((n) => n.props.children);
    expect(titles).toEqual(["Lent out", "Waiting for you"]);
  });

  it("Message opens the thread with the borrower about that item", async () => {
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Message Jamie"));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/chat-thread",
      params: { id: "u2", name: "Jamie", itemId: "drill" },
    });
  });

  it("Mark returned asks first, then calls markReturned", async () => {
    mocked(confirm).mockResolvedValue(true);
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Mark returned"));

    expect(confirm).toHaveBeenCalledWith(
      "Mark as returned?",
      expect.stringContaining("Jamie"),
      { confirmText: "Mark returned" }
    );
    await waitFor(() => expect(mockActions.markReturned).toHaveBeenCalledWith("r1"));
  });

  it("does nothing when the confirm is cancelled", async () => {
    mocked(confirm).mockResolvedValue(false);
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Mark returned"));

    await waitFor(() => expect(confirm).toHaveBeenCalled());
    expect(mockActions.markReturned).not.toHaveBeenCalled();
    expect(screen.getByText("Mark returned")).toBeTruthy();
  });

  it("moves a returned item to History", async () => {
    mockBorrowing.borrowingHistory = [
      { id: "h1", request_id: "r1", borrowed_at: T2, returned_at: T3 },
    ];
    await render(<Requests />);

    expect(screen.queryByText("Lent out")).toBeNull();
    expect(screen.queryByText("Mark returned")).toBeNull();
    expect(screen.getByText("History")).toBeTruthy();
    expect(screen.getByText(/Lent to Jamie/)).toBeTruthy();
  });
});

describe("I asked for", () => {
  it("lists your requests with their status and opens one", async () => {
    mockBorrowing.myRequests = [
      request("mine-1", "their-tent", "me", "pending"),
      request("mine-2", "their-ladder", "me", "approved"),
    ];
    await render(<Requests />);
    await showAskedFor();

    expect(await screen.findByText("Tent")).toBeTruthy();
    expect(screen.getByText("Ladder")).toBeTruthy();
    expect(screen.getByText(/^Pending · Sent/)).toBeTruthy();
    expect(screen.getByText(/^Approved · arrange pickup · Sent/)).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Open request for Ladder"));
    expect(mockRouter.push).toHaveBeenCalledWith("/request/mine-2");
  });

  it("shows Cancel only on a pending request and calls cancelRequest", async () => {
    mockBorrowing.myRequests = [
      request("mine-1", "their-tent", "me", "pending"),
      request("mine-2", "their-ladder", "me", "declined"),
    ];
    await render(<Requests />);
    await showAskedFor();

    expect(screen.getAllByText("Cancel")).toHaveLength(1);
    await fireEvent.press(screen.getByText("Cancel"));

    expect(mockActions.cancelRequest).toHaveBeenCalledWith("mine-1");
  });

  it("pressing Cancel doesn't also open the request", async () => {
    mockBorrowing.myRequests = [request("mine-1", "their-tent", "me", "pending")];
    await render(<Requests />);
    await showAskedFor();

    await fireEvent.press(screen.getByText("Cancel"));

    expect(mockActions.cancelRequest).toHaveBeenCalledWith("mine-1");
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("the card itself isn't pressable; only its top area opens the request", async () => {
    mockBorrowing.myRequests = [request("mine-1", "their-tent", "me", "pending")];
    await render(<Requests />);
    await showAskedFor();

    const card = screen.getByTestId("asked-mine-1");
    expect(card.props.onPress).toBeUndefined();
    expect(card.props.onClick).toBeUndefined();

    await fireEvent.press(await screen.findByText("Tent"));
    expect(mockRouter.push).toHaveBeenCalledWith("/request/mine-1");
  });
});

it("caps History at the 10 most recent", async () => {
  mockMyItems = [item("drill", "Drill")];
  mockBorrowing.incomingRequests = Array.from({ length: 12 }, (_, i) =>
    request(`r${i}`, "drill", "u2", "approved")
  );
  mockBorrowing.borrowingHistory = Array.from({ length: 12 }, (_, i) => ({
    id: `h${i}`,
    request_id: `r${i}`,
    borrowed_at: `2026-10-${String(i + 1).padStart(2, "0")}T09:00:00.000000+00:00`,
    returned_at: `2026-10-${String(i + 1).padStart(2, "0")}T18:00:00.000000+00:00`,
  }));
  await render(<Requests />);

  expect(screen.getAllByText(/Lent to Jamie/)).toHaveLength(10);
});
