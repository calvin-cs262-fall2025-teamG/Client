import { AZURE_API_URL, DATABASE_MODE } from "../config/database";
import { User } from "../context/AuthContext";
import {
    BorrowRequest,
    Chat,
    getAllItems as getAllItemsLocal,
    getAllUsers as getAllUsersLocal,
    getBorrowRequestsByUserId as getBorrowRequestsByUserIdLocal,
    getChatsByUserId as getChatsByUserIdLocal,
    getItemById as getItemByIdLocal,
    getOrCreateUserLocal,
    initialize,
    Item,
    Message,
    sendVerificationCodeLocal,
    verifyCodeLocal,
} from "./mockDatabase";

// Re-export types for convenience
export type { BorrowRequest, Chat, Item, Message, User };

// Initialize mock database if needed
if (DATABASE_MODE === "mock") {
  initialize();
}

/**
 * Send a verification code to the user's email
 */
export const sendVerificationCode = async (email: string): Promise<void> => {
  if (DATABASE_MODE === "mock") {
    return sendVerificationCodeLocal(email);
  }

  const response = await fetch(`${AZURE_API_URL}/auth/send-verification-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send verification code");
  }
};

/**
 * Verify the code provided by the user
 */
export const verifyCode = async (
  email: string,
  code: string
): Promise<void> => {
  if (DATABASE_MODE === "mock") {
    return verifyCodeLocal(email, code);
  }

  const response = await fetch(`${AZURE_API_URL}/auth/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Invalid verification code");
  }
};

/**
 * Get an existing user or create a new one
 */
export const getOrCreateUser = async (email: string): Promise<User> => {
  if (DATABASE_MODE === "mock") {
    return getOrCreateUserLocal(email);
  }

  const response = await fetch(`${AZURE_API_URL}/auth/get-or-create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get or create user");
  }

  return response.json();
};

/**
 * Fetch user profile by ID
 */
export const getUserProfile = async (userId: number): Promise<User> => {
  const response = await fetch(`${AZURE_API_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user profile");
  }

  return response.json();
};

/**
 * Get all users
 */
export const getAllUsers = async (): Promise<User[]> => {
  if (DATABASE_MODE === "mock") {
    return getAllUsersLocal();
  }

  const response = await fetch(`${AZURE_API_URL}/users`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch users");
  }

  return response.json();
};

/**
 * Get all items
 */
export const getAllItems = async (): Promise<Item[]> => {
  if (DATABASE_MODE === "mock") {
    return getAllItemsLocal();
  }

  const response = await fetch(`${AZURE_API_URL}/items`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch items");
  }

  return response.json();
};

/**
 * Get item by ID
 */
export const getItemById = async (itemId: number): Promise<Item | null> => {
  if (DATABASE_MODE === "mock") {
    return getItemByIdLocal(itemId);
  }

  const response = await fetch(`${AZURE_API_URL}/items/${itemId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch item");
  }

  return response.json();
};

/**
 * Get all borrow requests for a user
 */
export const getBorrowRequestsByUserId = async (userId: number): Promise<BorrowRequest[]> => {
  if (DATABASE_MODE === "mock") {
    return getBorrowRequestsByUserIdLocal(userId);
  }

  const response = await fetch(`${AZURE_API_URL}/borrow-requests?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch borrow requests");
  }

  return response.json();
};

/**
 * Get all chats for a user
 */
export const getChatsByUserId = async (userId: number): Promise<Chat[]> => {
  if (DATABASE_MODE === "mock") {
    return getChatsByUserIdLocal(userId);
  }

  const response = await fetch(`${AZURE_API_URL}/chats?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch chats");
  }

  return response.json();
};
