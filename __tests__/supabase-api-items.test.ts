import { community_members, items } from "../services/supabase_api";

const mockRpc = jest.fn();

jest.mock("../lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: { getUser: jest.fn() },
    storage: { from: jest.fn() },
  },
}));

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "generated-id") }));

beforeEach(() => {
  jest.clearAllMocks();
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

it("requests membership in each distinct community", async () => {
  mockRpc.mockResolvedValue({ data: null, error: null });

  await community_members.requestToJoinMany(["c1", "c2", "c1"]);

  expect(mockRpc).toHaveBeenCalledTimes(2);
  expect(mockRpc).toHaveBeenNthCalledWith(1, "request_join_community", { p_community_id: "c1" });
  expect(mockRpc).toHaveBeenNthCalledWith(2, "request_join_community", { p_community_id: "c2" });
});
