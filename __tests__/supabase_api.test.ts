jest.mock("../app/utils/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
    storage: { from: jest.fn() },
  },
}));

import { supabase } from "../app/utils/supabase";
import { getImageUrl, profiles } from "../services/supabase_api";

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

  const result = await getImageUrl("item-images", "users/UserA/Item.JPG", 900);

  expect(storageFrom).toHaveBeenCalledWith("item-images");
  expect(createSignedUrl).toHaveBeenCalledWith("users/UserA/Item.JPG", 900);
  expect(result).toEqual({ signedUrl: "https://example.test/signed", error: null });
});