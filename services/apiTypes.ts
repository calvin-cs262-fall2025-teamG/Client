// Items
export interface CreateItemRequest {
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  owner_id: number;
  request_status?: string;
  start_date?: string;
  end_date?: string;
}
export interface UpdateItemRequest {
  name?: string;
  description?: string;
  image_url?: string;
  category?: string;
  request_status?: string;
  start_date?: string;
  end_date?: string;
}

// Messages
export interface CreateMessageRequest {
  sender_id: number;
  receiver_id: number;
  item_id?: number;
  content: string;
}

// Users
export interface UpdateUserRequest {
  name?: string;
  profile_picture?: string;
}
