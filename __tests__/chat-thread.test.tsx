import React from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import ChatThread from "../app/chat-thread";
import * as api from "../services/supabase_api";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mutable so tests can add a draft / itemId
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" } }),
}));

// Defined once so getProfile keeps the same identity across renders
const mockGetProfile = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ getProfile: mockGetProfile }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  direct_messages: { getConversation: jest.fn(), create: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const OLDEST = "2026-10-19T12:00:00.123456+00:00";
const MIDDLE = "2026-10-19T12:05:00.123456+00:00";
const NEWEST = "2026-10-19T12:10:00.654321+00:00";
const SENT = "2026-10-19T12:15:00.000001+00:00";

const dm = (id: string, sender_id: string, content: string, created_at: string) => ({
  id,
  sender_id,
  receiver_id: sender_id === "me" ? "u2" : "me",
  item_id: null,
  content,
  created_at,
});

const readState = async () =>
  JSON.parse((await AsyncStorage.getItem("lastRead:me")) ?? "{}");

const textColor = (text: string) =>
  StyleSheet.flatten(screen.getByText(text).props.style).color;

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = { id: "u2", name: "Jamie" };
  await AsyncStorage.clear();
  jest.spyOn(console, "error").mockImplementation(() => {});
  // Deliberately out of order, to check the client sorts
  mocked(api.direct_messages.getConversation).mockImplementation(() =>
    ok([
      dm("m3", "u2", "See you then", NEWEST),
      dm("m1", "u2", "Is the drill free?", OLDEST),
      dm("m2", "me", "Yes, come by at 5", MIDDLE),
    ])
  );
  mockGetProfile.mockResolvedValue({ id: "u2", display_name: "Jamie R", avatar_path: null });
  mocked(api.direct_messages.create).mockImplementation(
    ({ receiver_id, content }: { receiver_id: string; content: string }) =>
      ok({ id: "m4", sender_id: "me", receiver_id, item_id: null, content, created_at: SENT })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("shows messages oldest first and marks your own differently", async () => {
  await render(<ChatThread />);
  await screen.findByText("Is the drill free?");

  const order = screen
    .getAllByText(/^(Is the drill free\?|Yes, come by at 5|See you then)$/)
    .map((node) => node.props.children);
  expect(order).toEqual(["Is the drill free?", "Yes, come by at 5", "See you then"]);

  expect(api.direct_messages.getConversation).toHaveBeenCalledWith("u2");
  expect(textColor("Yes, come by at 5")).toBe("#fff");
  expect(textColor("Is the drill free?")).not.toBe("#fff");
  // Route param name wins over the profile's display_name
  expect(screen.getByText("Jamie")).toBeTruthy();
});

it("sends a trimmed message and shows it", async () => {
  await render(<ChatThread />);
  await screen.findByText("Is the drill free?");

  await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "  thanks! ");
  await fireEvent.press(screen.getByText("↑"));

  expect(await screen.findByText("thanks!")).toBeTruthy();
  expect(api.direct_messages.create).toHaveBeenCalledWith({ receiver_id: "u2", content: "thanks!" });
  expect(api.direct_messages.getConversation).toHaveBeenCalledTimes(1);
  expect(screen.getByPlaceholderText("Message...").props.value).toBe("");
});

it("keeps the text in the input when sending fails", async () => {
  mocked(api.direct_messages.create).mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: "nope" } })
  );
  await render(<ChatThread />);
  await screen.findByText("Is the drill free?");

  await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "thanks!");
  await fireEvent.press(screen.getByText("↑"));

  await waitFor(() => expect(console.error).toHaveBeenCalled());
  expect(screen.getByPlaceholderText("Message...").props.value).toBe("thanks!");
  expect(screen.queryAllByText("thanks!")).toHaveLength(0);
});

it("prefills the input with the route draft without sending it", async () => {
  mockParams = { ...mockParams, draft: "Hi! I'd love to borrow your Drill.", itemId: "item-1" };
  await render(<ChatThread />);
  await screen.findByText("Is the drill free?");

  expect(screen.getByPlaceholderText("Message...").props.value).toBe(
    "Hi! I'd love to borrow your Drill."
  );
  expect(api.direct_messages.create).not.toHaveBeenCalled();
});

it("attaches item_id to the first message sent only", async () => {
  mockParams = { ...mockParams, draft: "Hi! I'd love to borrow your Drill.", itemId: "item-1" };
  let n = 0;
  mocked(api.direct_messages.create).mockImplementation(
    ({ receiver_id, content }: { receiver_id: string; content: string }) =>
      ok({ id: `sent-${++n}`, sender_id: "me", receiver_id, item_id: null, content, created_at: SENT })
  );
  await render(<ChatThread />);
  await screen.findByText("Is the drill free?");

  await fireEvent.press(screen.getByText("↑"));
  expect(await screen.findByText("Hi! I'd love to borrow your Drill.")).toBeTruthy();

  await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "Is tomorrow ok?");
  await fireEvent.press(screen.getByText("↑"));
  expect(await screen.findByText("Is tomorrow ok?")).toBeTruthy();

  expect(mocked(api.direct_messages.create).mock.calls).toEqual([
    [{ receiver_id: "u2", content: "Hi! I'd love to borrow your Drill.", item_id: "item-1" }],
    [{ receiver_id: "u2", content: "Is tomorrow ok?" }],
  ]);
});

it("saves the newest created_at under dm:u2 and keeps other keys", async () => {
  await AsyncStorage.setItem("lastRead:me", JSON.stringify({ "community:c1": OLDEST }));
  await render(<ChatThread />);
  await screen.findByText("See you then");

  await waitFor(async () =>
    expect(await readState()).toEqual({ "community:c1": OLDEST, "dm:u2": NEWEST })
  );

  await fireEvent.changeText(screen.getByPlaceholderText("Message..."), "thanks!");
  await fireEvent.press(screen.getByText("↑"));

  await waitFor(async () =>
    expect(await readState()).toEqual({ "community:c1": OLDEST, "dm:u2": SENT })
  );
});
