import React from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react-native";
import ChatThread from "../app/chat-thread";
import * as api from "../services/supabase_service";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

const mockRouter = { push: jest.fn(), back: jest.fn() };

// Mutable so tests can add a draft / itemId
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
  useRouter: () => mockRouter,
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me", display_name: "Bryn" } }),
}));

// Defined once so getProfile keeps the same identity across renders
const mockGetProfile = jest.fn();
jest.mock("../context/ProfileContext", () => ({
  useProfile: () => ({ getProfile: mockGetProfile }),
}));

// Mutable so tests can add borrowing requests; refresh keeps one identity
let mockBorrowing: Record<string, unknown[]> = {};
const mockRefreshBorrowing = jest.fn(() => Promise.resolve());
jest.mock("../context/BorrowingContext", () => ({
  useBorrowing: () => ({ ...mockBorrowing, refresh: mockRefreshBorrowing }),
}));
let mockMyItems: unknown[] = [];
jest.mock("../context/ItemsContext", () => ({
  useItems: () => ({ myItems: mockMyItems }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_service", () => ({
  direct_messages: { getConversation: jest.fn(), create: jest.fn() },
  items: { getById: jest.fn() },
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
  mockBorrowing = { myRequests: [], incomingRequests: [], borrowingHistory: [] };
  mockMyItems = [];
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

it("shows No messages yet for a conversation with no messages", async () => {
  mocked(api.direct_messages.getConversation).mockImplementation(() => ok([]));

  await render(<ChatThread />);

  expect(await screen.findByText("No messages yet")).toBeTruthy();
});

describe("borrowing request for the conversation's item", () => {
  const BEFORE_NEWEST = "2026-10-19T12:07:00.000000+00:00";
  const AFTER_ALL = "2026-10-20T08:00:00.000000+00:00";

  const tent = (owner_id = "u2") => ({
    id: "tent",
    name: "Tent",
    owner_id,
    status: "borrowed",
    description: null,
    category: "Outdoors",
    image_path: null,
    return_date: null,
    created_at: OLDEST,
    updated_at: OLDEST,
  });

  const request = (status: string, requester_id = "me", decided_at: string | null = BEFORE_NEWEST) => ({
    id: "r1",
    item_id: "tent",
    requester_id,
    status,
    requested_at: OLDEST,
    decided_at: status === "pending" ? null : decided_at,
  });

  const openHistory = (returned_at: string | null = null) => [
    { id: "h1", request_id: "r1", borrowed_at: BEFORE_NEWEST, returned_at },
  ];

  // Message text and the approval note, top to bottom
  const listOrder = () =>
    screen
      .getAllByText(/^(Is the drill free\?|Yes, come by at 5|See you then|.*approved.*request)$/)
      .map((node) => node.props.children);

  beforeEach(() => {
    mockParams = { ...mockParams, itemId: "tent" };
    mocked(api.items.getById).mockImplementation(() => ok(tent()));
  });

  it("pins the item with its approved status and links to the request", async () => {
    mockBorrowing.myRequests = [request("approved")];
    mockBorrowing.borrowingHistory = openHistory();
    await render(<ChatThread />);

    const pinned = await screen.findByTestId("pinned-item");
    expect(within(pinned).getByText("Tent")).toBeTruthy();
    expect(within(pinned).getByText("Approved · arrange pickup")).toBeTruthy();
    expect(api.items.getById).toHaveBeenCalledWith("tent");
    expect(mockRefreshBorrowing).toHaveBeenCalled();

    await fireEvent.press(within(pinned).getByText("Details"));
    expect(mockRouter.push).toHaveBeenCalledWith("/request/r1");
  });

  it("shows Pending and Returned statuses", async () => {
    mockBorrowing.myRequests = [request("pending")];
    const { unmount } = await render(<ChatThread />);
    expect(await screen.findByText("Pending")).toBeTruthy();
    await unmount();

    mockBorrowing.myRequests = [request("approved")];
    mockBorrowing.borrowingHistory = openHistory(NEWEST);
    await render(<ChatThread />);
    expect(await screen.findByText("Returned")).toBeTruthy();
  });

  it("finds the item from the newest message when the route has none", async () => {
    mockParams = { id: "u2", name: "Jamie" };
    mocked(api.direct_messages.getConversation).mockImplementation(() =>
      ok([
        { ...dm("m1", "u2", "Is the drill free?", OLDEST), item_id: "tent" },
        dm("m2", "me", "Yes, come by at 5", MIDDLE),
      ])
    );
    mockBorrowing.myRequests = [request("pending")];
    await render(<ChatThread />);

    expect(await screen.findByTestId("pinned-item")).toBeTruthy();
  });

  it("pins nothing without a request for the item", async () => {
    await render(<ChatThread />);
    await screen.findByText("Is the drill free?");

    expect(screen.queryByTestId("pinned-item")).toBeNull();
    expect(api.items.getById).not.toHaveBeenCalled();
  });

  it("pins nothing when the item belongs to someone other than this person", async () => {
    mocked(api.items.getById).mockImplementation(() => ok(tent("someone-else")));
    mockBorrowing.myRequests = [request("approved")];
    await render(<ChatThread />);
    await waitFor(() => expect(api.items.getById).toHaveBeenCalled());

    expect(screen.queryByTestId("pinned-item")).toBeNull();
    expect(screen.queryByTestId("approval-note")).toBeNull();
  });

  it("places the approval note at decided_at, between the messages around it", async () => {
    mockBorrowing.myRequests = [request("approved")];
    mockBorrowing.borrowingHistory = openHistory();
    await render(<ChatThread />);
    await screen.findByText("Jamie approved your request");

    expect(listOrder()).toEqual([
      "Is the drill free?",
      "Yes, come by at 5",
      "Jamie approved your request",
      "See you then",
    ]);
  });

  it("puts the note last when the approval came after every message", async () => {
    mockBorrowing.myRequests = [request("approved", "me", AFTER_ALL)];
    mockBorrowing.borrowingHistory = openHistory();
    await render(<ChatThread />);
    await screen.findByText("Jamie approved your request");

    expect(listOrder()).toEqual([
      "Is the drill free?",
      "Yes, come by at 5",
      "See you then",
      "Jamie approved your request",
    ]);
  });

  it("shows no note while the request is pending", async () => {
    mockBorrowing.myRequests = [request("pending")];
    await render(<ChatThread />);
    await screen.findByText("Pending");

    expect(screen.queryByTestId("approval-note")).toBeNull();
  });

  it("for the lender, says you approved and shows no quick replies", async () => {
    mockMyItems = [tent("me")];
    mockBorrowing.incomingRequests = [request("approved", "u2")];
    mockBorrowing.borrowingHistory = openHistory();
    await render(<ChatThread />);

    expect(await screen.findByText("You approved Jamie's request")).toBeTruthy();
    expect(within(screen.getByTestId("pinned-item")).getByText("Tent")).toBeTruthy();
    expect(api.items.getById).not.toHaveBeenCalled();
    expect(screen.queryByText("When can I pick it up?")).toBeNull();
  });

  it("quick-reply chips fill the input for the borrower after approval", async () => {
    mockBorrowing.myRequests = [request("approved")];
    mockBorrowing.borrowingHistory = openHistory();
    await render(<ChatThread />);
    const input = () => screen.getByPlaceholderText("Message...");

    await fireEvent.press(await screen.findByText("When can I pick it up?"));
    expect(input().props.value).toBe("When can I pick it up?");

    await fireEvent.press(screen.getByText("I’ll return it by …"));
    expect(input().props.value).toBe("I’ll return it by ");
    expect(api.direct_messages.create).not.toHaveBeenCalled();
  });

  it("hides the chips before approval and after return", async () => {
    mockBorrowing.myRequests = [request("pending")];
    const { unmount } = await render(<ChatThread />);
    await screen.findByText("Pending");
    expect(screen.queryByText("When can I pick it up?")).toBeNull();
    await unmount();

    mockBorrowing.myRequests = [request("approved")];
    mockBorrowing.borrowingHistory = openHistory(NEWEST);
    await render(<ChatThread />);
    await screen.findByText("Returned");
    expect(screen.queryByText("When can I pick it up?")).toBeNull();
  });
});
