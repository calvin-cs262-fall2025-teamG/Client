import React from "react";
import { render, screen } from "@testing-library/react-native";
import ListerProfile from "../app/profile/[name]";

// Mutable so tests can drop the id param
let mockParams: { name: string; id?: string } = { name: "Jamie", id: "u2" };
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockParams,
}));

// Defined once so getProfile keeps the same identity across renders
const mockGetProfile = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({ getProfile: mockGetProfile }),
}));

type JsonNode = { props: Record<string, any>; children: (JsonNode | string)[] | null };

// Collects every rendered host element whose source prop is { uri }
function imagesWithUri(): string[] {
  const found: string[] = [];
  const walk = (node: JsonNode | string | null) => {
    if (!node || typeof node === "string") return;
    if (node.props?.source?.uri) found.push(node.props.source.uri);
    node.children?.forEach(walk);
  };
  const tree = screen.toJSON() as JsonNode | JsonNode[] | null;
  (Array.isArray(tree) ? tree : [tree]).forEach(walk);
  return found;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { name: "Jamie", id: "u2" };
  mockGetProfile.mockResolvedValue({ id: "u2", display_name: "Jamie Rivera", avatar_path: null });
});

it("shows the profile's display name once loaded", async () => {
  await render(<ListerProfile />);

  expect(await screen.findByText("Jamie Rivera's Profile")).toBeTruthy();
  expect(mockGetProfile).toHaveBeenCalledWith("u2");
});

it("falls back to the name param when the profile isn't found", async () => {
  mockGetProfile.mockResolvedValue(null);
  await render(<ListerProfile />);

  expect(await screen.findByText("Jamie's Profile")).toBeTruthy();
  expect(mockGetProfile).toHaveBeenCalledWith("u2");
});

it("shows the name param without loading when there is no id", async () => {
  mockParams = { name: "Jamie" };
  await render(<ListerProfile />);

  expect(screen.getByText("Jamie's Profile")).toBeTruthy();
  expect(mockGetProfile).not.toHaveBeenCalled();
});

it("shows an http avatar as an image", async () => {
  mockGetProfile.mockResolvedValue({
    id: "u2",
    display_name: "Jamie Rivera",
    avatar_path: "https://x.test/jamie.png",
  });
  await render(<ListerProfile />);
  await screen.findByText("Jamie Rivera's Profile");

  expect(imagesWithUri()).toEqual(["https://x.test/jamie.png"]);
});

it("shows the placeholder when the profile has no http avatar", async () => {
  mockGetProfile.mockResolvedValue({ id: "u2", display_name: "Jamie Rivera", avatar_path: "jamie.png" });
  await render(<ListerProfile />);
  await screen.findByText("Jamie Rivera's Profile");

  expect(imagesWithUri()).toEqual([]);
});
