import React from "react";
import { Alert, type AlertButton } from "react-native";
import { act, render, screen, fireEvent } from "@testing-library/react-native";
import CommunityInfo from "../app/community-info";
import * as api from "../services/supabase_api";
import type { CommunityMemberRole } from "../services/supabase_api";

const mockRouter = { dismissTo: jest.fn() };
jest.mock("expo-router", () => ({
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: "c1" }),
  useRouter: () => mockRouter,
}));

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "me" } }),
}));

const mockLeaveCommunity = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ leaveCommunity: mockLeaveCommunity }),
}));

// A factory mock keeps the real supabase client (which needs .env) from loading.
jest.mock("../services/supabase_api", () => ({
  communities: { getById: jest.fn() },
  community_members: { getByCommunity: jest.fn() },
  profiles: { getById: jest.fn() },
}));

const ok = (data: unknown) => Promise.resolve({ data, error: null });
const mocked = (fn: unknown) => fn as jest.Mock;

const names: Record<string, string> = {
  me: "Bryn",
  o1: "Zed",
  a1: "Yara",
  a2: "Abe",
  m1: "Cleo",
};

// Listed out of order on purpose; the screen sorts them
function membersWithMyRole(myRole: CommunityMemberRole) {
  return [
    { user_id: "m1", role: "member" },
    { user_id: "a1", role: "admin" },
    { user_id: "me", role: myRole },
    { user_id: "a2", role: "admin" },
    ...(myRole === "owner" ? [] : [{ user_id: "o1", role: "owner" }]),
  ];
}

let alertSpy: jest.SpyInstance;

// Press a button in the most recent Alert.alert call with that title
const pressAlertButton = async (title: string, buttonText: string) => {
  const call = [...alertSpy.mock.calls].reverse().find((c) => c[0] === title);
  const buttons = (call?.[2] ?? []) as AlertButton[];
  await act(async () => {
    await buttons.find((b) => b.text === buttonText)?.onPress?.();
  });
};

async function renderAs(myRole: CommunityMemberRole) {
  mocked(api.community_members.getByCommunity).mockImplementation(() =>
    ok(membersWithMyRole(myRole))
  );
  await render(<CommunityInfo />);
  await screen.findByText("Knollcrest");
}

// The name, plus " (you)" for the current user
const memberNames = () =>
  screen
    .getAllByText(/^(Bryn|Zed|Yara|Abe|Cleo)/)
    .map((el) => ([] as unknown[]).concat(el.props.children).join(""));

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mocked(api.communities.getById).mockImplementation(() =>
    ok({ id: "c1", name: "Knollcrest", description: null, avatar_path: null })
  );
  mocked(api.profiles.getById).mockImplementation((id: string) =>
    ok({ id, display_name: names[id], avatar_path: null })
  );
  mockLeaveCommunity.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("leaving", () => {
  it("stops an owner with an alert and does not leave", async () => {
    await renderAs("owner");

    await fireEvent.press(screen.getByText("Leave community"));

    expect(alertSpy).toHaveBeenCalledWith("You're the owner", "Owners can't leave a community yet.");
    expect(mockLeaveCommunity).not.toHaveBeenCalled();
  });

  it.each(["admin", "member"] as const)("lets the %s role leave after confirming", async (role) => {
    await renderAs(role);

    await fireEvent.press(screen.getByText("Leave community"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Leave community?",
      "You'll stop seeing messages in Knollcrest.",
      expect.any(Array)
    );
    expect(mockLeaveCommunity).not.toHaveBeenCalled();

    await pressAlertButton("Leave community?", "Leave");

    expect(mockLeaveCommunity).toHaveBeenCalledWith("c1");
    expect(mockRouter.dismissTo).toHaveBeenCalledWith("/chat");
  });

  it("does not leave when the confirmation is cancelled", async () => {
    await renderAs("member");

    await fireEvent.press(screen.getByText("Leave community"));
    await pressAlertButton("Leave community?", "Cancel");

    expect(mockLeaveCommunity).not.toHaveBeenCalled();
  });

  it("shows the Couldn't leave alert when leaving fails", async () => {
    mockLeaveCommunity.mockRejectedValue(new Error("network"));
    await renderAs("member");

    await fireEvent.press(screen.getByText("Leave community"));
    await pressAlertButton("Leave community?", "Leave");

    expect(alertSpy).toHaveBeenCalledWith("Couldn't leave", "Please try again.");
    expect(mockRouter.dismissTo).not.toHaveBeenCalled();
  });
});

describe("members", () => {
  it("labels owners and admins, not members, and marks you", async () => {
    await renderAs("member");

    expect(screen.getAllByText("Owner")).toHaveLength(1);
    expect(screen.getAllByText("Admin")).toHaveLength(2);
    expect(screen.queryByText("Member")).toBeNull();
    expect(memberNames()).toContain("Bryn (you)");
    expect(memberNames().filter((n) => n.endsWith("(you)"))).toHaveLength(1);
  });

  it("sorts owner, then admins, then members, by name within each role", async () => {
    await renderAs("member");

    expect(memberNames()).toEqual(["Zed", "Abe", "Yara", "Bryn (you)", "Cleo"]);
  });

  it("shows Couldn't load this community when loading fails", async () => {
    mocked(api.communities.getById).mockImplementation(() =>
      Promise.resolve({ data: null, error: { message: "permission denied" } })
    );
    mocked(api.community_members.getByCommunity).mockImplementation(() => ok([]));

    await render(<CommunityInfo />);

    expect(await screen.findByText("Couldn't load this community.")).toBeTruthy();
    expect(screen.queryByText("Leave community")).toBeNull();
  });
});
