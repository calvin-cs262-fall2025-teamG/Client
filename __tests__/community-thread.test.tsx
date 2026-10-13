import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import CommunityThread from "../app/community-thread";
import * as chat from "../services/chat";

jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "c1", name: "Calvin Seniors" }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_id: 7, name: "Bryn" } }),
}));

jest.mock("../services/chat");

const mocked = chat as jest.Mocked<typeof chat>;

beforeEach(() => {
  mocked.getCommunityMessages.mockResolvedValue([
    {
      id: "m1",
      community_id: "c1",
      sender_id: "2",
      sender_name: "Greg",
      sender_avatar: null,
      content: "Hello neighbors",
      created_at: new Date().toISOString(),
    },
  ] as any);
  mocked.subscribeToCommunity.mockReturnValue(() => {});
  mocked.sendCommunityMessage.mockResolvedValue({} as any);
});

it("renders messages from the service", async () => {
  await render(<CommunityThread />);
  expect(await screen.findByText("Hello neighbors")).toBeTruthy();
});

it("sends a trimmed message as the logged-in user", async () => {
  await render(<CommunityThread />);
  await screen.findByText("Hello neighbors");

  await fireEvent.changeText(screen.getByPlaceholderText(/message/i), "  hi ");
  await fireEvent.press(screen.getByLabelText("Send message"));

  await waitFor(() =>
    expect(mocked.sendCommunityMessage).toHaveBeenCalledWith(
      "c1",
      { id: "7", name: "Bryn" },
      "hi"
    )
  );
});