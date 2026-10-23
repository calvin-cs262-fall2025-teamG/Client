import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import Requests from "../app/requests";
import * as api from "../services/supabase_api";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getById: jest.fn() },
}));

// Mutable so tests can set up each section; functions keep one identity across renders
let mockDb: Record<string, unknown[]> = {};
const mockActions = {
  refresh: jest.fn(() => Promise.resolve()),
  getProfile: jest.fn(() => Promise.resolve(null)),
  approveRequest: jest.fn(() => Promise.resolve()),
  declineRequest: jest.fn(() => Promise.resolve()),
  cancelRequest: jest.fn(() => Promise.resolve()),
  markReturned: jest.fn(() => Promise.resolve()),
};
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({
    ...mockDb,
    profilesById: { u2: { id: "u2", display_name: "Jamie", avatar_path: null } },
    ...mockActions,
  }),
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const T1 = "2026-10-19T12:00:00.123456+00:00";
const T2 = "2026-10-20T09:30:00.654321+00:00";

const item = (id: string, name: string, status = "available") => ({
  id,
  name,
  status,
  owner_id: "me",
  community_id: "c1",
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

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockDb = { myItems: [], myRequests: [], incomingRequests: [], borrowingHistory: [] };
  mocked(api.items.getById).mockImplementation((id: string) =>
    ok(item(id, id === "their-tent" ? "Tent" : "Ladder"))
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("shows the empty state when there is nothing", async () => {
  await render(<Requests />);

  expect(screen.getByText("No requests yet")).toBeTruthy();
  expect(screen.queryByText("Requests for your items")).toBeNull();
  expect(screen.queryByText("Out now")).toBeNull();
  expect(screen.queryByText("Your requests")).toBeNull();
  expect(screen.queryByText("History")).toBeNull();
  expect(mockActions.refresh).toHaveBeenCalled();
});

describe("requests for your items", () => {
  beforeEach(() => {
    mockDb.myItems = [item("drill", "Drill")];
    mockDb.incomingRequests = [request("r1", "drill", "u2", "pending")];
  });

  it("shows the item and who is asking", async () => {
    await render(<Requests />);

    expect(screen.getByText("Requests for your items")).toBeTruthy();
    expect(screen.getByText("Drill")).toBeTruthy();
    expect(screen.getByText("Jamie wants to borrow this")).toBeTruthy();
    expect(mockActions.getProfile).toHaveBeenCalledWith("u2");
    expect(screen.queryByText("No requests yet")).toBeNull();
  });

  it("Approve calls approveRequest with the request id", async () => {
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Approve"));

    expect(mockActions.approveRequest).toHaveBeenCalledWith("r1");
    expect(mockActions.declineRequest).not.toHaveBeenCalled();
  });

  it("Decline calls declineRequest with the request id", async () => {
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Decline"));

    expect(mockActions.declineRequest).toHaveBeenCalledWith("r1");
    expect(mockActions.approveRequest).not.toHaveBeenCalled();
  });

  it("shows the error alert when a call throws and lets you try again", async () => {
    mockActions.approveRequest.mockRejectedValueOnce(new Error("Pending request not found"));
    await render(<Requests />);

    await fireEvent.press(screen.getByText("Approve"));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Something went wrong",
        "Could not approve the request. Please try again."
      )
    );

    // The buttons are usable again: a second press goes through
    await fireEvent.press(screen.getByText("Approve"));
    expect(mockActions.approveRequest).toHaveBeenCalledTimes(2);
  });

  it("hides decided requests from this section", async () => {
    mockDb.incomingRequests = [request("r1", "drill", "u2", "declined")];
    await render(<Requests />);

    expect(screen.queryByText("Requests for your items")).toBeNull();
    expect(screen.queryByText("Approve")).toBeNull();
  });
});

describe("out now", () => {
  beforeEach(() => {
    mockDb.myItems = [item("drill", "Drill", "borrowed")];
    mockDb.incomingRequests = [request("r1", "drill", "u2", "approved")];
    mockDb.borrowingHistory = [{ id: "h1", request_id: "r1", borrowed_at: T2, returned_at: null }];
  });

  it("shows the borrowed item and Mark returned calls markReturned", async () => {
    await render(<Requests />);

    expect(screen.getByText("Out now")).toBeTruthy();
    expect(screen.getByText("Borrowed by Jamie")).toBeTruthy();

    await fireEvent.press(screen.getByText("Mark returned"));

    expect(mockActions.markReturned).toHaveBeenCalledWith("r1");
  });

  it("does not list an approved request that was already returned", async () => {
    mockDb.borrowingHistory = [{ id: "h1", request_id: "r1", borrowed_at: T1, returned_at: T2 }];
    await render(<Requests />);

    expect(screen.queryByText("Out now")).toBeNull();
    expect(screen.queryByText("Mark returned")).toBeNull();
    // ...but it still shows in History
    expect(screen.getByText("History")).toBeTruthy();
    expect(screen.getByText(/Lent to Jamie/)).toBeTruthy();
  });
});

describe("your requests", () => {
  it("shows Cancel only on a pending request and calls cancelRequest", async () => {
    mockDb.myRequests = [
      request("mine-1", "their-tent", "me", "pending"),
      request("mine-2", "their-ladder", "me", "declined"),
    ];
    await render(<Requests />);

    expect(screen.getByText("Your requests")).toBeTruthy();
    expect(await screen.findByText("Tent")).toBeTruthy();
    expect(screen.getByText("Ladder")).toBeTruthy();
    expect(screen.getByText(/^Pending ·/)).toBeTruthy();
    expect(screen.getByText(/^Declined ·/)).toBeTruthy();
    expect(screen.getAllByText("Cancel")).toHaveLength(1);

    await fireEvent.press(screen.getByText("Cancel"));

    expect(mockActions.cancelRequest).toHaveBeenCalledWith("mine-1");
  });

  it("has no Cancel button when nothing is pending", async () => {
    mockDb.myRequests = [request("mine-3", "their-tent", "me", "approved")];
    await render(<Requests />);

    expect(screen.getByText(/^Approved ·/)).toBeTruthy();
    expect(screen.queryByText("Cancel")).toBeNull();
  });
});

it("caps History at the 10 most recent", async () => {
  mockDb.myItems = [item("drill", "Drill")];
  mockDb.incomingRequests = Array.from({ length: 12 }, (_, i) =>
    request(`r${i}`, "drill", "u2", "approved")
  );
  mockDb.borrowingHistory = Array.from({ length: 12 }, (_, i) => ({
    id: `h${i}`,
    request_id: `r${i}`,
    borrowed_at: `2026-10-${String(i + 1).padStart(2, "0")}T09:00:00.000000+00:00`,
    returned_at: `2026-10-${String(i + 1).padStart(2, "0")}T18:00:00.000000+00:00`,
  }));
  await render(<Requests />);

  expect(screen.getAllByText(/Lent to Jamie/)).toHaveLength(10);
});
