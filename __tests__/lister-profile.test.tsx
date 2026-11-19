import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
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

// Storage paths are signed by StorageImage; http URLs are used as-is
const mockGetImageUrl = jest.fn();
jest.mock("../services/supabase_service", () => ({
  getImageUrl: (...args: unknown[]) => mockGetImageUrl(...args),
}));

type JsonNode = { props: Record<string, any>; children: (JsonNode | string)[] | null };

// Collects every rendered host element whose source is { uri }. expo-image
// passes its source down as an array.
function imagesWithUri(): string[] {
  const found: string[] = [];
  const walk = (node: JsonNode | string | null) => {
    if (!node || typeof node === "string") return;
    const sources = [node.props?.source].flat();
    sources.forEach((src) => src?.uri && found.push(src.uri));
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
  mockGetImageUrl.mockResolvedValue({ signedUrl: null, error: null });
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

it("shows a storage avatar through a signed URL", async () => {
  mockGetImageUrl.mockResolvedValue({ signedUrl: "https://signed.test/jamie.png", error: null });
  mockGetProfile.mockResolvedValue({ id: "u2", display_name: "Jamie Rivera", avatar_path: "u2/avatar.png" });
  await render(<ListerProfile />);
  await screen.findByText("Jamie Rivera's Profile");

  await waitFor(() => expect(imagesWithUri()).toEqual(["https://signed.test/jamie.png"]));
  expect(mockGetImageUrl).toHaveBeenCalledWith("profile-pictures", "u2/avatar.png", 3600);
});

it("shows the placeholder when the profile has no avatar", async () => {
  await render(<ListerProfile />);
  await screen.findByText("Jamie Rivera's Profile");

  expect(imagesWithUri()).toEqual([]);
  expect(mockGetImageUrl).not.toHaveBeenCalled();
});
