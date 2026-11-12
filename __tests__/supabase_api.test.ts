jest.mock("../app/utils/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

jest.mock("expo-crypto", () => ({ randomUUID: () => "image-id" }));

jest.mock("expo-file-system", () => ({
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
  },
}));

import { supabase } from "../app/utils/supabase";
import { getSignedUrl, items, profiles } from "../services/supabase_api";

const rpc = supabase.rpc as jest.Mock;
const getUser = supabase.auth.getUser as jest.Mock;
const storageFrom = supabase.storage.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "UserA" } }, error: null });
});

it("keeps profile updates as direct RPC calls", async () => {
  const data = { display_name: "Neighbor" };
  rpc.mockResolvedValue({ data: null, error: null });

  await profiles.update(data);

  expect(rpc).toHaveBeenCalledWith("update_my_profile", { p_data: data });
  expect(storageFrom).not.toHaveBeenCalled();
});

it("wraps signed URL creation as a storage call", async () => {
  const createSignedUrl = jest.fn().mockResolvedValue({
    data: { signedUrl: "https://example.test/signed" },
    error: null,
  });
  storageFrom.mockReturnValue({ createSignedUrl });

  const result = await getSignedUrl("item-images", "users/UserA/Item.JPG", 900);

  expect(storageFrom).toHaveBeenCalledWith("item-images");
  expect(createSignedUrl).toHaveBeenCalledWith("users/UserA/Item.JPG", 900);
  expect(result).toEqual({ signedUrl: "https://example.test/signed", error: null });
});

it("uploads a create image in the API and saves the returned path", async () => {
  const upload = jest.fn().mockResolvedValue({
    data: { path: "users/UserA/image.jpg" },
    error: null,
  });
  storageFrom.mockReturnValue({ upload });
  rpc.mockResolvedValue({ data: null, error: null });

  const data = { community_id: "community-1", name: "Drill", category: "Tools" };
  await items.create(data, { uri: "file:///image.jpg", mimeType: "image/jpeg" });

  expect(storageFrom).toHaveBeenCalledWith("item-images");
  expect(upload).toHaveBeenCalledWith(
    "users/UserA/image.jpg",
    expect.objectContaining({ uri: "file:///image.jpg" }),
    { contentType: "image/jpeg", upsert: false },
  );
  expect(rpc).toHaveBeenCalledWith("create_item", {
    p_data: { ...data, image_path: "users/UserA/image.jpg" },
  });
});

it("uploads an update image in the API and saves the returned path", async () => {
  const upload = jest.fn().mockResolvedValue({
    data: { path: "users/UserA/image-id.png" },
    error: null,
  });
  storageFrom.mockReturnValue({ upload });
  rpc.mockResolvedValue({ data: null, error: null });

  const data = { name: "Updated drill" };
  await items.update("item-1", data, {
    uri: "file:///image.png",
    mimeType: "image/png",
  });

  expect(upload).toHaveBeenCalledWith(
    "users/UserA/image-id.png",
    expect.objectContaining({ uri: "file:///image.png" }),
    { contentType: "image/png", upsert: false },
  );
  expect(rpc).toHaveBeenCalledWith("update_item", {
    p_item_id: "item-1",
    p_data: { ...data, image_path: "users/UserA/image-id.png" },
  });
});