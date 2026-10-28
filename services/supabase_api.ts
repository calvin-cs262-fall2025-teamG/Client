import { randomUUID } from "expo-crypto";
import { supabase } from "../app/utils/supabase";
import type { Tables, TablesInsert, TablesUpdate } from "./supabase_database.types";

export type Profile = Tables<"profiles">;
export type Community = Tables<"communities">;
export type CommunityMember = Tables<"community_members">;
export type CommunityMessage = Tables<"community_messages">;
export type DirectMessage = Tables<"direct_messages">;
export type Item = Tables<"items">;
export type BorrowingRequest = Tables<"borrowing_requests">;
export type BorrowingHistory = Tables<"borrowing_history">;

export type CreateCommunityRequest = Omit<TablesInsert<"communities">, "owner_id" | "created_at" | "updated_at">;
export type UpdateCommunityRequest = Omit<TablesUpdate<"communities">, "id" | "owner_id" | "created_at" | "updated_at">;
export type CreateItemRequest = Omit<TablesInsert<"items">, "owner_id" | "status" | "created_at" | "updated_at">;
export type UpdateItemRequest = Omit<TablesUpdate<"items">, "id" | "owner_id" | "created_at" | "updated_at">;
export type UpdateProfileRequest = Omit<TablesUpdate<"profiles">, "id" | "created_at" | "updated_at">;
export type CreateDirectMessageRequest = Pick<TablesInsert<"direct_messages">, "receiver_id" | "content" | "item_id">;
export type CreateCommunityMessageRequest = Pick<TablesInsert<"community_messages">, "community_id" | "content" | "item_id">;

export type CommunityMemberRole = "owner" | "admin" | "member";

type ImageInput = { data: ArrayBuffer; ext?: string };
export type ImageBucket = "profile-pictures" | "item-images" | "community-images";

async function uploadImage(bucket: string, path: string, img: ImageInput) {
  const ext = (img.ext ?? "jpeg").replace(/^\./, "").toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const contentType = contentTypes[ext];
  const fullPath = `${path}.${ext}`;
  if (!contentType) {
    return { path: fullPath, error: new Error(`Unsupported image extension: ${ext}`) };
  }

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, img.data, { contentType, upsert: false });
  return { path: fullPath, error };
}

export async function getImageUrl(
  bucket: ImageBucket,
  path: string | null,
  expiresIn = 3600,
) {
  if (!path) return { signedUrl: null, error: null };

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  return { signedUrl: data?.signedUrl ?? null, error };
}

async function getCurrentUserId() {
  const res = await supabase.auth.getUser();
  if (res.error) return { id: null, error: res.error};
  return { id: res.data.user?.id ?? null };
}

export const profiles = {
  getById: (id: string) => supabase.rpc("get_profile", { p_id: id }),

  getCurrent: () => supabase.rpc("get_my_profile"),

  update: async (data: UpdateProfileRequest, image?: ImageInput) => {
    if (image) {
      const userId = await getCurrentUserId();
      if ( userId.error ) return { data: null, error: userId.error};
      if (!userId.id) return { data: null, error: new Error("Not signed in") };
      const up = await uploadImage("profile-pictures", `${userId.id}/avatar-${randomUUID()}`, image);
      if (up.error) return { data: null, error: up.error };
      data = { ...data, avatar_path: up.path };
    }
    const res = await supabase.rpc("update_my_profile", { p_data: data });
    if (res.error) return { ...res, error: res.error };
    return res;
  },
};

export const communities = {
  getAll: () => supabase.rpc("get_communities"),

  getMine: () => supabase.rpc("get_my_communities"),

  getById: (id: string) => supabase.rpc("get_community", { p_community_id: id }),

  create: async (data: CreateCommunityRequest, image?: ImageInput) => {
    /* 
      Maybe can be fixed?
      Note this operation is not atomic. If the upload fails, the community 
      has already been created without an image. If the follow-up update 
      fails, the community remains and the uploaded image is unreferenced 
      until the server’s orphan sweep queues it for cleanup. The failure 
      response currently returns { data: null, error }, so callers should be 
      aware that a community may exist even when create reports an error.
    */
    if (image) {
      const create_res = await supabase.rpc("create_community", { p_data: data });
      if (create_res.error)  return { ...create_res, error: create_res.error };
      const up = await uploadImage("community-images", `${create_res.data.id}/avatar-${randomUUID()}`, image);
      if (up.error) return { data: null, error: up.error };
      const res = await supabase.rpc("update_community", { p_community_id: create_res.data.id, p_data: { avatar_path: up.path } })
      if (res.error) return { data: null, error: res.error };
      return res;
    }
    
    const res = await supabase.rpc("create_community", { p_data: data });
    if (res.error) return { ...res, error: res.error };
    return res;    
  },

  update: async (id: string, data: UpdateCommunityRequest, image?: ImageInput) => {
    if (image) {
      const up = await uploadImage("community-images", `${id}/avatar-${randomUUID()}`, image);
      if (up.error) return { data: null, error: up.error };
      data = { ...data, avatar_path: up.path };
    }
    const res = await supabase.rpc("update_community", { p_community_id: id, p_data: data });
    if (res.error) return { ...res, error: res.error };
    return res;
  },

  delete: async (id: string) => {
    return supabase.rpc("delete_community", { p_community_id: id });
  },
};

export const community_members = {
  getByCommunity: (communityId: string) =>
    supabase.rpc("get_community_members", { p_community_id: communityId }),

  getPendingByCommunity: (communityId: string) =>
    supabase.rpc("get_pending_community_members", { p_community_id: communityId }),

  requestToJoin: (communityId: string) =>
    supabase.rpc("request_join_community", { p_community_id: communityId }),

  approve: (communityId: string, userId: string) =>
    supabase.rpc("approve_community_member", { p_community_id: communityId, p_user_id: userId }),

  decline: (communityId: string, userId: string) =>
    supabase.rpc("decline_community_member", { p_community_id: communityId, p_user_id: userId }),

  setRole: (communityId: string, userId: string, role: CommunityMemberRole) =>
    supabase.rpc("set_community_member_role", {
      p_community_id: communityId,
      p_user_id: userId,
      p_role: role,
    }),

  remove: (communityId: string, userId: string) =>
    supabase.rpc("remove_community_member", { p_community_id: communityId, p_user_id: userId }),

  leave: (communityId: string) => supabase.rpc("leave_community", { p_community_id: communityId }),

  markRead: (communityId: string) => supabase.rpc("mark_community_read", { p_community_id: communityId }),

  isMember: (communityId: string) => supabase.rpc("is_community_member", { target_community_id: communityId }),

  isAdmin: (communityId: string) => supabase.rpc("is_community_admin", { target_community_id: communityId }),
};

export const community_messages = {
  getByCommunity: (communityId: string, opts?: { limit?: number; before?: string }) =>
    supabase.rpc("get_community_messages", {
      p_community_id: communityId,
      p_limit: opts?.limit,
      p_before: opts?.before,
    }),

  create: (data: CreateCommunityMessageRequest) =>
    supabase.rpc("create_community_message", {
      p_community_id: data.community_id,
      p_content: data.content,
      p_item_id: data.item_id ?? undefined,
    }),

  delete: (id: string) => supabase.rpc("delete_community_message", { p_message_id: id }),

  getUnreadCount: (communityId: string) =>
    supabase.rpc("get_community_unread_count", { p_community_id: communityId }),
};

export const direct_messages = {
  getAll: () => supabase.rpc("get_my_direct_messages"),

  getConversation: (otherUserId: string) =>
    supabase.rpc("get_direct_conversation", { p_other_user_id: otherUserId }),

  getConversations: () => supabase.rpc("get_my_conversations"),

  create: (data: CreateDirectMessageRequest) =>
    supabase.rpc("create_direct_message", {
      p_receiver_id: data.receiver_id,
      p_content: data.content,
      p_item_id: data.item_id ?? undefined,
    }),
};

export const items = {
  getAll: () => supabase.rpc("get_items"),

  getByCommunity: (communityId: string) => supabase.rpc("get_community_items", { p_community_id: communityId }),

  getMine: () => supabase.rpc("get_my_items"),

  getById: (id: string) => supabase.rpc("get_item", { p_item_id: id }),

  create: async (data: CreateItemRequest, image?: ImageInput) => {
    if (image) {
      const userId = await getCurrentUserId();
      if ( userId.error ) return { data: null, error: userId.error};
      if (!userId.id) return { data: null, error: new Error("Not signed in") };
      const id = randomUUID();
      const up = await uploadImage("item-images", `${userId.id}/${id}/main-${randomUUID()}`, image);
      if (up.error) return { data: null, error: up.error };
      data = { ...data, id:id, image_path: up.path};
      const res = await supabase.rpc("create_item", { p_data: data });
      if (res.error) return {...res, error: res.error};
      return res;
    }
    
    const res = await supabase.rpc("create_item", { p_data: data });
    if (res.error) return {...res, error: res.error};
    return res;
  },

  update: async (id: string, data: UpdateItemRequest, image?: ImageInput) => {
    if (image) {
      const userId = await getCurrentUserId();
      if ( userId.error ) return { data: null, error: userId.error};
      if (!userId.id) return { data: null, error: new Error("Not signed in") };
      const up = await uploadImage("item-images", `${userId.id}/${id}/main-${randomUUID()}`, image);
      if (up.error) return { data: null, error: up.error };
      data = { ...data, image_path: up.path };
    }
    const res = await supabase.rpc("update_item", { p_item_id: id, p_data: data });
    if (res.error) return { ...res, error: res.error };
    return res;
  },

  delete: async (id: string) => {
    const res = await supabase.rpc("delete_item", { p_item_id: id });
    return res;
  },
};

export const borrowing_requests = {
  getById: (id: string) => supabase.rpc("get_borrowing_request", { p_request_id: id }),

  getMine: () => supabase.rpc("get_my_borrowing_requests"),

  getIncoming: () => supabase.rpc("get_incoming_borrowing_requests"),

  getByItem: (itemId: string) => supabase.rpc("get_item_borrowing_requests", { p_item_id: itemId }),

  create: (itemId: string) => supabase.rpc("create_borrowing_request", { p_item_id: itemId }),

  approve: (id: string) => supabase.rpc("approve_borrowing_request", { p_request_id: id }),

  decline: (id: string) => supabase.rpc("decline_borrowing_request", { p_request_id: id }),

  cancel: (id: string) => supabase.rpc("cancel_borrowing_request", { p_request_id: id }),
};

export const borrowing_history = {
  getMine: () => supabase.rpc("get_my_borrowing_history"),

  getByItem: (itemId: string) => supabase.rpc("get_item_borrowing_history", { p_item_id: itemId }),

  getByRequest: (requestId: string) =>
    supabase.rpc("get_borrowing_history_by_request", { p_request_id: requestId }),

  markReturned: (requestId: string) =>
    supabase.rpc("mark_item_returned", { p_request_id: requestId }),
};