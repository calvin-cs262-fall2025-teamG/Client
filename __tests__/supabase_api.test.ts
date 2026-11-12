jest.mock("../app/utils/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

jest.mock("expo-file-system", () => ({
  File: class {
    uri: string;
    constructor(uri: string) {
      this.uri = uri;
    }
  },
}));

import { supabase } from "../app/utils/supabase";
import { getSignedUrl, profiles, uploadImage } from "../services/supabase_api";

const rpc = supabase.rpc as jest.Mock;
const storageFrom = supabase.storage.from as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
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

it("uploads images through Supabase Storage", async () => {
  const upload = jest.fn().mockResolvedValue({
    data: { path: "users/UserA/image.jpg" },
    error: null,
  });
  storageFrom.mockReturnValue({ upload });

  const result = await uploadImage(
    "item-images",
    "users/UserA/image.jpg",
    "file:///image.jpg",
    "image/jpeg",
  );

  expect(storageFrom).toHaveBeenCalledWith("item-images");
  expect(upload).toHaveBeenCalledWith(
    "users/UserA/image.jpg",
    expect.objectContaining({ uri: "file:///image.jpg" }),
    { contentType: "image/jpeg", upsert: false },
  );
  expect(result).toEqual({ path: "users/UserA/image.jpg", error: null });
});