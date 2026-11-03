import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import CommunityThread from "../app/community-thread";
import * as api from "../services/supabase_api";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "c1", name: "Calvin Seniors" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "7", display_name: "Bryn" } }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  community_messages: { getByCommunity: jest.fn(), create: jest.fn() },
  profiles: { getById: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const NEWER = "2026-10-19T12:05:00.000Z";
const OLDER = "2026-10-19T12:00:00.000Z";

const readState = async () =>
  JSON.parse((await AsyncStorage.getItem("lastRead:7")) ?? "{}");

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  // Newest first, the order get_community_messages returns
  mocked(api.community_messages.getByCommunity).mockImplementation(() =>
    ok([
      { id: "m2", community_id: "c1", sender_id: "2", content: "Anyone have a ladder?", created_at: NEWER, item_id: null },
      { id: "m1", community_id: "c1", sender_id: "2", content: "Hello neighbors", created_at: OLDER, item_id: null },
    ])
  );
  mocked(api.profiles.getById).mockImplementation((id: string) =>
    ok({ id, display_name: "Greg", avatar_path: null })
  );
  mocked(api.community_messages.create).mockImplementation(
    ({ community_id, content }: { community_id: string; content: string }) =>
      ok({ id: "m3", community_id, sender_id: "7", content, created_at: "2026-10-19T12:10:00.000Z", item_id: null })
  );
});

it("loads messages for the community and shows sender names", async () => {
  await render(<CommunityThread />);
  expect(await screen.findByText("Hello neighbors")).toBeTruthy();
  expect(screen.getByText("Anyone have a ladder?")).toBeTruthy();
  expect(await screen.findAllByText("Greg")).toHaveLength(2);
  expect(api.community_messages.getByCommunity).toHaveBeenCalledWith("c1");
  expect(api.profiles.getById).toHaveBeenCalledTimes(1);
});

it("saves the newest message's created_at as last read", async () => {
  await render(<CommunityThread />);
  await screen.findByText("Hello neighbors");
  await waitFor(async () => expect(await readState()).toEqual({ "community:c1": NEWER }));
});

it("keeps read state for other chats when saving", async () => {
  await AsyncStorage.setItem("lastRead:7", JSON.stringify({ "dm:9": OLDER }));
  await render(<CommunityThread />);
  await screen.findByText("Hello neighbors");
  await waitFor(async () =>
    expect(await readState()).toEqual({ "dm:9": OLDER, "community:c1": NEWER })
  );
});

it("sends a trimmed message and shows it", async () => {
  await render(<CommunityThread />);
  await screen.findByText("Hello neighbors");

  await fireEvent.changeText(screen.getByPlaceholderText(/message/i), "  hi ");
  await fireEvent.press(screen.getByLabelText("Send message"));

  await waitFor(() =>
    expect(api.community_messages.create).toHaveBeenCalledWith({ community_id: "c1", content: "hi" })
  );
  expect(await screen.findByText("hi")).toBeTruthy();
  await waitFor(async () =>
    expect(await readState()).toEqual({ "community:c1": "2026-10-19T12:10:00.000Z" })
  );
});

it("puts the text back if sending fails", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  mocked(api.community_messages.create).mockImplementation(() =>
    Promise.resolve({ data: null, error: { message: "nope" } })
  );
  await render(<CommunityThread />);
  await screen.findByText("Hello neighbors");

  await fireEvent.changeText(screen.getByPlaceholderText(/message/i), "hi");
  await fireEvent.press(screen.getByLabelText("Send message"));

  await waitFor(() => expect(screen.getByPlaceholderText(/message/i).props.value).toBe("hi"));
});
