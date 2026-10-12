import { supabase } from "../app/utils/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "./supabase_database.types";

// The RPCs below are not yet generated in the Database types, so calls go through
// an untyped wrapper and results are typed explicitly per function.
type RpcResult<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>;

const rpc = <T>(fn: string, args?: Record<string, unknown>): RpcResult<T> =>
  (supabase.rpc as unknown as (fn: string, args?: Record<string, unknown>) => RpcResult<T>)(fn, args);

export type Profile = Tables<"profiles">;
export type Community = Tables<"communities">;
export type CommunityMember = Tables<"community_members">;
export type CommunityMessage = Tables<"community_messages">;
export type DirectMessage = Tables<"direct_messages">;
export type Item = Tables<"items">;
export type BorrowingRequest = Tables<"borrowing_requests">;
export type BorrowingHistory = Tables<"borrowing_history">;

export type CreateCommunityRequest = Omit<TablesInsert<"communities">, "id" | "owner_id" | "created_at" | "updated_at">;
export type UpdateCommunityRequest = Omit<TablesUpdate<"communities">, "id" | "owner_id" | "created_at" | "updated_at">;
export type CreateItemRequest = Omit<TablesInsert<"items">, "id" | "owner_id" | "status" | "created_at" | "updated_at">;
export type UpdateItemRequest = Omit<TablesUpdate<"items">, "id" | "owner_id" | "created_at" | "updated_at">;
export type UpdateProfileRequest = Omit<TablesUpdate<"profiles">, "id" | "created_at" | "updated_at">;
export type CreateDirectMessageRequest = Pick<TablesInsert<"direct_messages">, "receiver_id" | "content" | "item_id">;
export type CreateCommunityMessageRequest = Pick<TablesInsert<"community_messages">, "community_id" | "content" | "item_id">;

export type CommunityMemberRole = "owner" | "admin" | "member";

export const profiles = {
  getById: (id: string) => rpc<Profile>("get_profile", { p_id: id }),

  getCurrent: () => rpc<Profile>("get_my_profile"),

  update: (data: UpdateProfileRequest) => rpc<Profile>("update_my_profile", { p_data: data }),
};

export const communities = {
  getAll: () => rpc<Community[]>("get_communities"),

  getMine: () => rpc<Community[]>("get_my_communities"),

  getById: (id: string) => rpc<Community>("get_community", { p_community_id: id }),

  create: (data: CreateCommunityRequest) => rpc<Community>("create_community", { p_data: data }),

  update: (id: string, data: UpdateCommunityRequest) =>
    rpc<Community>("update_community", { p_community_id: id, p_data: data }),

  delete: (id: string) => rpc<null>("delete_community", { p_community_id: id }),
};

export const community_members = {
  getByCommunity: (communityId: string) =>
    rpc<CommunityMember[]>("get_community_members", { p_community_id: communityId }),

  getPendingByCommunity: (communityId: string) =>
    rpc<CommunityMember[]>("get_pending_community_members", { p_community_id: communityId }),

  requestToJoin: (communityId: string) =>
    rpc<CommunityMember>("request_join_community", { p_community_id: communityId }),

  approve: (communityId: string, userId: string) =>
    rpc<CommunityMember>("approve_community_member", { p_community_id: communityId, p_user_id: userId }),

  decline: (communityId: string, userId: string) =>
    rpc<CommunityMember>("decline_community_member", { p_community_id: communityId, p_user_id: userId }),

  setRole: (communityId: string, userId: string, role: CommunityMemberRole) =>
    rpc<CommunityMember>("set_community_member_role", {
      p_community_id: communityId,
      p_user_id: userId,
      p_role: role,
    }),

  remove: (communityId: string, userId: string) =>
    rpc<null>("remove_community_member", { p_community_id: communityId, p_user_id: userId }),

  leave: (communityId: string) => rpc<null>("leave_community", { p_community_id: communityId }),

  markRead: (communityId: string) => rpc<null>("mark_community_read", { p_community_id: communityId }),

  isMember: (communityId: string) => rpc<boolean>("is_community_member", { target_community_id: communityId }),

  isAdmin: (communityId: string) => rpc<boolean>("is_community_admin", { target_community_id: communityId }),
};

export const community_messages = {
  getByCommunity: (communityId: string, opts?: { limit?: number; before?: string }) =>
    rpc<CommunityMessage[]>("get_community_messages", {
      p_community_id: communityId,
      p_limit: opts?.limit ?? null,
      p_before: opts?.before ?? null,
    }),

  create: (data: CreateCommunityMessageRequest) =>
    rpc<CommunityMessage>("create_community_message", {
      p_community_id: data.community_id,
      p_content: data.content,
      p_item_id: data.item_id ?? null,
    }),

  delete: (id: string) => rpc<null>("delete_community_message", { p_message_id: id }),

  getUnreadCount: (communityId: string) =>
    rpc<number>("get_community_unread_count", { p_community_id: communityId }),
};

export const direct_messages = {
  getAll: () => rpc<DirectMessage[]>("get_my_direct_messages"),

  getConversation: (otherUserId: string) =>
    rpc<DirectMessage[]>("get_direct_conversation", { p_other_user_id: otherUserId }),

  getConversations: () => rpc<DirectMessage[]>("get_my_conversations"),

  create: (data: CreateDirectMessageRequest) =>
    rpc<DirectMessage>("create_direct_message", {
      p_receiver_id: data.receiver_id,
      p_content: data.content,
      p_item_id: data.item_id ?? null,
    }),
};

export const items = {
  getAll: () => rpc<Item[]>("get_items"),

  getByCommunity: (communityId: string) => rpc<Item[]>("get_community_items", { p_community_id: communityId }),

  getMine: () => rpc<Item[]>("get_my_items"),

  getById: (id: string) => rpc<Item>("get_item", { p_item_id: id }),

  create: (data: CreateItemRequest) => rpc<Item>("create_item", { p_data: data }),

  update: (id: string, data: UpdateItemRequest) => rpc<Item>("update_item", { p_item_id: id, p_data: data }),

  delete: (id: string) => rpc<null>("delete_item", { p_item_id: id }),
};

export const borrowing_requests = {
  getById: (id: string) => rpc<BorrowingRequest>("get_borrowing_request", { p_request_id: id }),

  getMine: () => rpc<BorrowingRequest[]>("get_my_borrowing_requests"),

  getIncoming: () => rpc<BorrowingRequest[]>("get_incoming_borrowing_requests"),

  getByItem: (itemId: string) => rpc<BorrowingRequest[]>("get_item_borrowing_requests", { p_item_id: itemId }),

  create: (itemId: string) => rpc<BorrowingRequest>("create_borrowing_request", { p_item_id: itemId }),

  approve: (id: string) => rpc<BorrowingRequest>("approve_borrowing_request", { p_request_id: id }),

  decline: (id: string) => rpc<BorrowingRequest>("decline_borrowing_request", { p_request_id: id }),

  cancel: (id: string) => rpc<BorrowingRequest>("cancel_borrowing_request", { p_request_id: id }),
};

export const borrowing_history = {
  getMine: () => rpc<BorrowingHistory[]>("get_my_borrowing_history"),

  getByItem: (itemId: string) => rpc<BorrowingHistory[]>("get_item_borrowing_history", { p_item_id: itemId }),

  getByRequest: (requestId: string) =>
    rpc<BorrowingHistory>("get_borrowing_history_by_request", { p_request_id: requestId }),

  markReturned: (requestId: string) =>
    rpc<BorrowingHistory>("mark_item_returned", { p_request_id: requestId }),
};
