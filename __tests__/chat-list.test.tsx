import React from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import Chat from "../app/(tabs)/chat";
import * as api from "../services/supabase_api";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockPush = jest.fn();
// Run the focus callback like a mount effect, as if the tab just came into focus
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react");
  return {
    useRouter: () => ({ push: mockPush }),
    useFocusEffect: (cb: () => void) => useEffect(cb, [cb]),
  };
});

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

// Mutable so tests can change the communities; refresh keeps one identity
let mockCommunities: { id: string; name: string }[] = [];
const mockRefresh = jest.fn(() => Promise.resolve());
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ myCommunities: mockCommunities, refresh: mockRefresh }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  direct_messages: { getConversations: jest.fn() },
  community_messages: { getByCommunity: jest.fn() },
  profiles: { getById: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

// Recent enough that the row shows a short time
const minutesAgo = (n: number) => new Date(Date.now() - n * 60000).toISOString();

const T_GREG = minutesAgo(5);
const T_ROSE = minutesAgo(90);
const T_COMMUNITY = minutesAgo(30);

const dm = (id: string, sender_id: string, receiver_id: string, content: string, created_at: string) => ({
  id,
  sender_id,
  receiver_id,
  content,
  created_at,
  item_id: null,
  read_at: null,
});

const PROFILES: Record<string, { id: string; display_name: string; avatar_path: string | null }> = {
  greg: { id: "greg", display_name: "Greg", avatar_path: null },
  rose: { id: "rose", display_name: "Rose", avatar_path: null },
};

// Greg wrote last (unread); Rose's chat ends with my own message (read)
const CONVERSATIONS = [
  dm("m1", "greg", "me", "Is the drill free Saturday?", T_GREG),
  dm("m2", "me", "rose", "Thanks for the tent!", T_ROSE),
];

const COMMUNITY_MESSAGE = {
  id: "cm1",
  community_id: "c1",
  sender_id: "greg",
  content: "Block party at 6",
  created_at: T_COMMUNITY,
  item_id: null,
};

// The tappable row that contains this text
function rowOf(text: string) {
  let node = screen.getByText(text) as unknown as { parent: unknown; props: Record<string, unknown> } | null;
  while (node && !(node.props.accessible === true && typeof node.props.onClick === "function")) {
    node = node.parent as typeof node;
  }
  if (!node) throw new Error(`No row for ${text}`);
  return node;
}

// The orange dot the row shows for an unread chat
function hasUnreadDot(text: string): boolean {
  const visit = (n: unknown): boolean => {
    if (!n || typeof n !== "object") return false;
    const el = n as { props?: { style?: unknown }; children?: unknown[] };
    const style = StyleSheet.flatten(el.props?.style as never) as Record<string, unknown> | undefined;
    if (style && style.width === 10 && style.height === 10 && style.backgroundColor === "#f97316") {
      return true;
    }
    return (el.children ?? []).some(visit);
  };
  return visit(rowOf(text));
}

async function renderChat() {
  await render(<Chat />);
  await waitFor(() => expect(screen.queryByText("Loading messages...")).toBeNull());
}

beforeEach(async () => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  await AsyncStorage.clear();
  mockCommunities = [{ id: "c1", name: "Maple Street" }];
  mocked(api.direct_messages.getConversations).mockImplementation(() => ok(CONVERSATIONS));
  mocked(api.community_messages.getByCommunity).mockImplementation(() => ok([COMMUNITY_MESSAGE]));
  mocked(api.profiles.getById).mockImplementation((id: string) => ok(PROFILES[id] ?? null));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("chat list", () => {
  it("shows direct messages with the other person's name and the last message", async () => {
    await renderChat();

    expect(screen.getByText("Greg")).toBeTruthy();
    expect(screen.getByText("Is the drill free Saturday?")).toBeTruthy();
    expect(screen.getByText("Rose")).toBeTruthy();
    // My own last message is shown with "You: "
    expect(screen.getByText("You: Thanks for the tent!")).toBeTruthy();
  });

  it("shows community chats with the sender and last message", async () => {
    await renderChat();

    expect(screen.getByText("Communities")).toBeTruthy();
    expect(screen.getByText("Maple Street")).toBeTruthy();
    expect(screen.getByText("Greg: Block party at 6")).toBeTruthy();
    expect(api.community_messages.getByCommunity).toHaveBeenCalledWith("c1", { limit: 1 });
  });

  it("shows You for my own last community message", async () => {
    mocked(api.community_messages.getByCommunity).mockImplementation(() =>
      ok([{ ...COMMUNITY_MESSAGE, sender_id: "me" }])
    );
    await renderChat();

    expect(screen.getByText("You: Block party at 6")).toBeTruthy();
  });

  it("shows No messages yet on a community with no messages", async () => {
    mocked(api.community_messages.getByCommunity).mockImplementation(() => ok([]));
    await renderChat();

    const row = rowOf("Maple Street");
    expect(row).toBeTruthy();
    expect(screen.getAllByText("No messages yet").length).toBeGreaterThan(0);
  });

  it("marks chats whose newest message is from someone else and unseen", async () => {
    await renderChat();

    expect(hasUnreadDot("Greg")).toBe(true);
    expect(hasUnreadDot("Maple Street")).toBe(true);
    // Rose's chat ends with my own message
    expect(hasUnreadDot("Rose")).toBe(false);
  });

  it("does not mark chats already seen", async () => {
    await AsyncStorage.setItem(
      "lastRead:me",
      JSON.stringify({ "dm:greg": T_GREG, "community:c1": T_COMMUNITY })
    );
    await renderChat();

    expect(hasUnreadDot("Greg")).toBe(false);
    expect(hasUnreadDot("Maple Street")).toBe(false);
  });

  it("shows Unknown when a profile can't be loaded", async () => {
    mocked(api.profiles.getById).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "boom" } })
    );
    await renderChat();

    expect(screen.getAllByText("Unknown").length).toBe(2);
  });
});

describe("empty states and search", () => {
  it("shows No messages yet when there are no conversations", async () => {
    mockCommunities = [];
    mocked(api.direct_messages.getConversations).mockImplementation(() => ok([]));
    await renderChat();

    expect(screen.getByText("No messages yet")).toBeTruthy();
    expect(screen.getByText("Start borrowing items to chat with neighbors")).toBeTruthy();
  });

  it("filters by name", async () => {
    await renderChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Search messages"), "rose");

    expect(screen.getByText("Rose")).toBeTruthy();
    expect(screen.queryByText("Greg")).toBeNull();
    expect(screen.queryByText("Maple Street")).toBeNull();
  });

  it("filters by message text", async () => {
    await renderChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Search messages"), "drill");

    expect(screen.getByText("Greg")).toBeTruthy();
    expect(screen.queryByText("Rose")).toBeNull();
  });

  it("filters communities by name", async () => {
    await renderChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Search messages"), "maple");

    expect(screen.getByText("Maple Street")).toBeTruthy();
    expect(screen.queryByText("Greg")).toBeNull();
  });

  it("shows No chats found when the search matches nothing", async () => {
    await renderChat();

    await fireEvent.changeText(screen.getByPlaceholderText("Search messages"), "zzz");

    expect(screen.getByText("No chats found")).toBeTruthy();
    expect(screen.getByText("Try a different search")).toBeTruthy();
    expect(screen.queryByText("Communities")).toBeNull();
  });
});

describe("opening chats", () => {
  it("opens a community thread", async () => {
    await renderChat();

    await fireEvent.press(screen.getByText("Maple Street"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/community-thread",
      params: { id: "c1", name: "Maple Street" },
    });
  });

  it("opens a direct message and marks it read", async () => {
    await renderChat();

    await fireEvent.press(screen.getByText("Greg"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/chat-thread",
      params: { id: "greg", name: "Greg", avatar: "" },
    });
    await waitFor(async () => {
      const saved = JSON.parse((await AsyncStorage.getItem("lastRead:me")) ?? "{}");
      expect(saved["dm:greg"]).toBe(T_GREG);
    });
    expect(hasUnreadDot("Greg")).toBe(false);
  });

  it("keeps read state saved by a thread when marking a DM read", async () => {
    await renderChat();
    // A thread screen saved its own read state after the list loaded
    await AsyncStorage.setItem("lastRead:me", JSON.stringify({ "community:c1": T_COMMUNITY }));

    await fireEvent.press(screen.getByText("Greg"));

    await waitFor(async () => {
      const saved = JSON.parse((await AsyncStorage.getItem("lastRead:me")) ?? "{}");
      expect(saved).toEqual({ "community:c1": T_COMMUNITY, "dm:greg": T_GREG });
    });
  });
});

describe("failed loads", () => {
  it("shows the screen instead of crashing when conversations fail to load", async () => {
    mocked(api.direct_messages.getConversations).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "network down" } })
    );
    await renderChat();

    expect(screen.getByPlaceholderText("Search messages")).toBeTruthy();
    expect(screen.getByText("Start borrowing items to chat with neighbors")).toBeTruthy();
    expect(console.error).toHaveBeenCalledWith("Failed to load chats:", expect.anything());
  });

  it("shows the screen when the request throws", async () => {
    mocked(api.direct_messages.getConversations).mockImplementation(() =>
      Promise.reject(new Error("offline"))
    );
    await renderChat();

    expect(screen.getByPlaceholderText("Search messages")).toBeTruthy();
  });

  it("still shows conversations when a community's messages fail to load", async () => {
    mocked(api.community_messages.getByCommunity).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "boom" } })
    );
    await renderChat();

    expect(screen.getByText("Greg")).toBeTruthy();
    expect(screen.getByText("Maple Street")).toBeTruthy();
  });
});
