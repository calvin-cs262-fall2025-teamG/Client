import React from "react";
import { Alert, type AlertButton } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import EditItem from "../app/edit-item";
import * as api from "../services/supabase_api";

// One router object, like expo-router's stable useRouter(); the load effect depends on it
const mockBack = jest.fn();
const mockRouter = { push: jest.fn(), back: mockBack };
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ id: "item-1" }),
  useRouter: () => mockRouter,
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" } }),
}));

const mockUpdateItem = jest.fn();
const mockDeleteItem = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ updateItem: mockUpdateItem, deleteItem: mockDeleteItem }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  items: { getById: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const makeItem = (overrides: Record<string, unknown> = {}) => ({
  id: "item-1",
  community_id: "c1",
  owner_id: "me",
  name: "Drill",
  description: "Cordless drill",
  category: "Tools",
  status: "available",
  image_path: null,
  return_date: null,
  created_at: "2026-10-19T12:00:00.123456+00:00",
  updated_at: "2026-10-19T12:00:00.123456+00:00",
  ...overrides,
});

// What get_item returns for an id that doesn't exist (or isn't visible)
const nullRow = Object.fromEntries(Object.keys(makeItem()).map((k) => [k, null]));

let alertSpy: jest.SpyInstance;

// Answer the delete confirmation as soon as it opens; handleDelete awaits it
const answerDeleteConfirm = (buttonText: "Delete" | "Cancel") =>
  alertSpy.mockImplementation((title, _msg, buttons?: AlertButton[]) => {
    if (title === "Delete item?") buttons?.find((b) => b.text === buttonText)?.onPress?.();
  });

// Press a button in the most recent Alert.alert call with that title
const pressAlertButton = (title: string, buttonText: string) => {
  const call = [...alertSpy.mock.calls].reverse().find((c) => c[0] === title);
  const buttons = (call?.[2] ?? []) as AlertButton[];
  buttons.find((b) => b.text === buttonText)?.onPress?.();
};

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mocked(api.items.getById).mockImplementation(() => ok(makeItem()));
  mockUpdateItem.mockImplementation(async (id: string, data: object) => ({ ...makeItem(), ...data, id }));
  mockDeleteItem.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function renderLoaded() {
  await render(<EditItem />);
  await screen.findByDisplayValue("Drill");
}

it("loads the item into the form", async () => {
  await renderLoaded();

  expect(api.items.getById).toHaveBeenCalledWith("item-1");
  expect(screen.getByDisplayValue("Tools")).toBeTruthy();
  expect(screen.getByDisplayValue("Cordless drill")).toBeTruthy();
});

it("shows the load error for a row without an id", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(nullRow));
  await render(<EditItem />);

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Error", "Could not load item details.")
  );
  expect(screen.queryByText("Loading item...")).toBeNull();
});

it("saves only name, description and category, never status", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ status: "borrowed" })));
  await renderLoaded();

  await fireEvent.changeText(screen.getByDisplayValue("Drill"), " Hammer drill ");
  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() => expect(mockUpdateItem).toHaveBeenCalled());
  expect(mockUpdateItem).toHaveBeenCalledWith("item-1", {
    name: "Hammer drill",
    description: "Cordless drill",
    category: "Tools",
  });
  expect(alertSpy).toHaveBeenCalledWith("Success", "Item updated successfully!", expect.any(Array));
  pressAlertButton("Success", "OK");
  expect(mockBack).toHaveBeenCalled();
});

it.each([
  ["available", "Available"],
  ["pending", "Pending request"],
  ["borrowed", "Borrowed"],
])("shows %s status as read-only %p", async (status, label) => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ status })));
  await renderLoaded();

  expect(screen.getByText(label)).toBeTruthy();
  // The old toggle offered the other statuses as buttons
  const others = ["Available", "Pending request", "Borrowed"].filter((l) => l !== label);
  others.forEach((l) => expect(screen.queryByText(l)).toBeNull());
});

it("shows the borrow request note only for a pending item", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ status: "pending" })));
  await renderLoaded();

  expect(screen.getByText(/A borrow request is waiting on this item/)).toBeTruthy();
});

it("hides the borrow request note for an available item", async () => {
  await renderLoaded();

  expect(screen.queryByText(/A borrow request is waiting on this item/)).toBeNull();
});

it("sends someone else's item back with an alert and no form", async () => {
  mocked(api.items.getById).mockImplementation(() => ok(makeItem({ owner_id: "someone-else" })));
  await render(<EditItem />);

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Error", "You can only edit your own items.")
  );
  expect(mockBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByDisplayValue("Drill")).toBeNull();
  expect(screen.queryByText("Save changes")).toBeNull();
  expect(api.items.getById).toHaveBeenCalledTimes(1);
});

it("stays on the screen when saving throws", async () => {
  mockUpdateItem.mockRejectedValue(new Error("Item not found or not permitted"));
  await renderLoaded();

  await fireEvent.press(screen.getByText("Save changes"));

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Error", "Could not save changes. Please try again.")
  );
  expect(alertSpy).not.toHaveBeenCalledWith("Success", expect.anything(), expect.anything());
  expect(mockBack).not.toHaveBeenCalled();
});

it("deletes the item after confirming", async () => {
  await renderLoaded();
  answerDeleteConfirm("Delete");

  await fireEvent.press(screen.getByText("Delete item"));

  await waitFor(() => expect(mockDeleteItem).toHaveBeenCalledWith("item-1"));
  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Deleted", "Item removed successfully.", expect.any(Array))
  );
});

it("does not delete when the confirmation is cancelled", async () => {
  await renderLoaded();
  answerDeleteConfirm("Cancel");

  await fireEvent.press(screen.getByText("Delete item"));

  expect(alertSpy).toHaveBeenCalledWith("Delete item?", expect.any(String), expect.any(Array));
  expect(mockDeleteItem).not.toHaveBeenCalled();
  expect(screen.getByText("Delete item")).toBeTruthy();
});
