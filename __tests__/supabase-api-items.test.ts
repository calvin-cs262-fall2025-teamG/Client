import { communities, community_members, items } from "../services/supabase_api";

const mockRpc = jest.fn();
const mockGetUser = jest.fn();
const mockUpload = jest.fn();
const mockStorageFrom = jest.fn((_bucket: string) => ({ upload: mockUpload }));

jest.mock("../lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    storage: { from: (bucket: string) => mockStorageFrom(bucket) },
  },
}));

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockReset();
  mockGetUser.mockReset();
  mockUpload.mockReset();
});

it("returns community IDs and propagates RPC errors", async () => {
  const result = { data: ["c1", "c2"], error: null };
  mockRpc.mockResolvedValueOnce(result);

  expect(await items.getCommunityIds("item-1")).toEqual(result);
  expect(mockRpc).toHaveBeenCalledWith("get_item_community_ids", { p_item_id: "item-1" });

  const failure = { data: null, error: { message: "permission denied" } };
  mockRpc.mockResolvedValueOnce(failure);
  expect(await items.getCommunityIds("item-1")).toEqual(failure);
});

it("forwards community selections on create and update", async () => {
  const result = { data: { id: "item-1" }, error: null };
  mockRpc.mockResolvedValue(result);

  const create = { name: "Drill", community_ids: ["c1", "c2"] };
  expect(await items.create(create)).toEqual(result);
  expect(mockRpc).toHaveBeenCalledWith("create_item", { p_data: create });

  const update = { community_ids: [] };
  expect(await items.update("item-1", update)).toEqual(result);
  expect(mockRpc).toHaveBeenCalledWith("update_item", { p_item_id: "item-1", p_data: update });

  const detailsOnly = { name: "Renamed" };
  await items.update("item-1", detailsOnly);
  expect(mockRpc).toHaveBeenCalledWith("update_item", { p_item_id: "item-1", p_data: detailsOnly });
});

it("forwards community management RPC arguments and responses", async () => {
  const result = { data: { id: "community-1" }, error: null };
  const failure = { data: null, error: { message: "permission denied" } };
  mockRpc.mockResolvedValueOnce(result)
    .mockResolvedValueOnce(failure)
    .mockResolvedValueOnce(result)
    .mockResolvedValueOnce(failure);

  expect(await communities.transferOwnership("community-1", "user-1")).toEqual(result);
  expect(mockRpc).toHaveBeenNthCalledWith(1, "transfer_community_ownership", {
    p_community_id: "community-1", p_new_owner_id: "user-1",
  });
  expect(await communities.removeItem("community-1", "item-1")).toEqual(failure);
  expect(mockRpc).toHaveBeenNthCalledWith(2, "remove_community_item", {
    p_community_id: "community-1", p_item_id: "item-1",
  });
  expect(await community_members.invite("community-1", "user-1")).toEqual(result);
  expect(mockRpc).toHaveBeenNthCalledWith(3, "invite_community_member", {
    p_community_id: "community-1", p_user_id: "user-1",
  });
  expect(await community_members.setStatus("community-1", "user-1", "declined")).toEqual(failure);
  expect(mockRpc).toHaveBeenNthCalledWith(4, "set_community_member_status", {
    p_community_id: "community-1", p_user_id: "user-1", p_status: "declined",
  });
});

it("uploads a community image before creating the community with its path", async () => {
  const image = { data: new ArrayBuffer(8), ext: "png" };
  const path = "generated-id/user-1/main-generated-id.png";
  const result = { data: { id: "generated-id", avatar_path: path }, error: null };
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockUpload.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue(result);

  expect(await communities.create({ name: "Oak Hall" }, image)).toEqual(result);
  expect(mockStorageFrom).toHaveBeenCalledWith("community-images");
  expect(mockUpload).toHaveBeenCalledWith(path, image.data, {
    contentType: "image/png", upsert: false,
  });
  expect(mockRpc).toHaveBeenCalledTimes(1);
  expect(mockRpc).toHaveBeenCalledWith("create_community", {
    p_data: { name: "Oak Hall", id: "generated-id", avatar_path: path },
  });
  expect(mockUpload.mock.invocationCallOrder[0]).toBeLessThan(mockRpc.mock.invocationCallOrder[0]);
});

it("does not create a community when its image upload fails", async () => {
  const error = new Error("upload failed");
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockUpload.mockResolvedValue({ error });

  expect(await communities.create({ name: "Oak Hall" }, { data: new ArrayBuffer(8) }))
    .toEqual({ data: null, error });
  expect(mockRpc).not.toHaveBeenCalled();
});

it("does not upload or create when the current user cannot be retrieved", async () => {
  const error = new Error("authentication failed");
  mockGetUser.mockResolvedValueOnce({ data: { user: null }, error });
  mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
  const image = { data: new ArrayBuffer(8) };

  expect(await communities.create({ name: "Oak Hall" }, image)).toEqual({ data: null, error });
  expect(await communities.create({ name: "Oak Hall" }, image))
    .toEqual({ data: null, error: new Error("Not signed in") });
  expect(mockStorageFrom).not.toHaveBeenCalled();
  expect(mockRpc).not.toHaveBeenCalled();
});

it("returns the create RPC error after an image upload", async () => {
  const failure = { data: null, error: { message: "community creation failed" } };
  mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mockUpload.mockResolvedValue({ error: null });
  mockRpc.mockResolvedValue(failure);

  expect(await communities.create({ name: "Oak Hall" }, { data: new ArrayBuffer(8) }))
    .toEqual(failure);
  expect(mockUpload.mock.invocationCallOrder[0]).toBeLessThan(mockRpc.mock.invocationCallOrder[0]);
});

it("creates a community without uploading when no image is supplied", async () => {
  const data = { name: "Oak Hall" };
  const result = { data: { id: "community-1" }, error: null };
  mockRpc.mockResolvedValue(result);

  expect(await communities.create(data)).toEqual(result);
  expect(mockRpc).toHaveBeenCalledWith("create_community", { p_data: data });
  expect(mockGetUser).not.toHaveBeenCalled();
  expect(mockStorageFrom).not.toHaveBeenCalled();
});
