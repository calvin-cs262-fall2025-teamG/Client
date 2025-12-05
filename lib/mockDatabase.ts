import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock database storage keys
const USERS_KEY = "heyneighbor:users";
const CODES_KEY = "heyneighbor:codes";
const ITEMS_KEY = "heyneighbor:items";
const BORROW_REQUESTS_KEY = "heyneighbor:borrow-requests";
const CHATS_KEY = "heyneighbor:chats";
const MESSAGES_KEY = "heyneighbor:messages";

export interface User {
  user_id: number;
  email: string;
  name: string;
  profile_picture?: string;
}

export interface Item {
  item_id: number;
  name: string;
  image_url?: string;
  category: string;
  owner_id: number;
  request_status: "borrowed" | "available" | "pending";
  start_date?: string;
  end_date?: string;
}

export interface BorrowRequest {
  request_id: number;
  user_id: number;
  item_id: number;
  request_datetime: number;
  status: "pending" | "approved" | "rejected";
}

export interface Chat {
  chat_id: number;
  user1_id: number;
  user2_id: number;
  last_message?: string;
  last_message_time?: number;
  unread_count?: number;
}

export interface Message {
  message_id: number;
  chat_id: number;
  sender_id: number;
  content: string;
  timestamp: number;
  read: boolean;
}

interface VerificationCode {
  email: string;
  code: string;
  created_at: number;
  expires_at: number;
  verified: boolean;
}

let nextUserId = 1;
let nextItemId = 1;
let nextRequestId = 1;
let nextChatId = 1;
let nextMessageId = 1;

/**
 * Initialize database with sample users
 */
export const initialize = async () => {
  try {
    const existing = await AsyncStorage.getItem(USERS_KEY);
    if (!existing) {
      const sampleUsers: Record<number, User> = {
        1: {
          user_id: 1,
          email: "alice@example.com",
          name: "Alice Johnson",
          profile_picture: "https://i.pravatar.cc/150?img=1",
        },
        2: {
          user_id: 2,
          email: "bob@example.com",
          name: "Bob Smith",
          profile_picture: "https://i.pravatar.cc/150?img=2",
        },
        3: {
          user_id: 3,
          email: "bryn@example.com",
          name: "Bryn",
          profile_picture: "https://i.pravatar.cc/150?img=3",
        },
        4: {
          user_id: 4,
          email: "charlie@example.com",
          name: "Charlie Kim",
          profile_picture: "https://i.pravatar.cc/150?img=4",
        },
        5: {
          user_id: 5,
          email: "dana@example.com",
          name: "Dana Lee",
          profile_picture: "https://i.pravatar.cc/150?img=5",
        },
      };
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(sampleUsers));
      nextUserId = 6;
    } else {
      // Track the highest user_id
      const users = JSON.parse(existing) as Record<number, User>;
      const ids = Object.keys(users).map((k) => parseInt(k));
      nextUserId = Math.max(...ids) + 1;
    }

    // Initialize items if not already done
    const itemsExisting = await AsyncStorage.getItem(ITEMS_KEY);
    if (!itemsExisting) {
      const sampleItems: Record<number, Item> = {
        1: {
          item_id: 1,
          name: "USB-C Charger",
          image_url: "https://images.unsplash.com/photo-1625948515291-69613efd103f?w=400&h=400&fit=crop",
          category: "Electronics",
          owner_id: 4,
          request_status: "available",
        },
        2: {
          item_id: 2,
          name: "Core 100 Book",
          image_url: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
          category: "Books",
          owner_id: 5,
          request_status: "borrowed",
        },
        3: {
          item_id: 3,
          name: "Office Chair",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 1,
          request_status: "available",
        },
        4: {
          item_id: 4,
          name: "Keurig",
          image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 3,
          request_status: "borrowed",
        },
        5: {
          item_id: 5,
          name: "Tool Set",
          image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 2,
          request_status: "available",
        },
        6: {
          item_id: 6,
          name: "Garden Tractor",
          image_url: "https://images.unsplash.com/photo-1585454737802-c4e1c5b15b9a?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 1,
          request_status: "available",
        },
        7: {
          item_id: 7,
          name: "Vacuum",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 2,
          request_status: "borrowed",
        },
        8: {
          item_id: 8,
          name: "Desk Lamp",
          image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 1,
          request_status: "available",
        },
        9: {
          item_id: 9,
          name: "Bluetooth Speaker",
          image_url: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop",
          category: "Electronics",
          owner_id: 2,
          request_status: "available",
        },
        10: {
          item_id: 10,
          name: "Mountain Bike",
          image_url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 4,
          request_status: "available",
        },
        11: {
          item_id: 11,
          name: "Cookware Set",
          image_url: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 5,
          request_status: "borrowed",
        },
        12: {
          item_id: 12,
          name: "Yoga Mat",
          image_url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop",
          category: "Fitness",
          owner_id: 1,
          request_status: "available",
        },
        13: {
          item_id: 13,
          name: "Wireless Headphones",
          image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
          category: "Electronics",
          owner_id: 3,
          request_status: "available",
        },
        14: {
          item_id: 14,
          name: "Standing Desk",
          image_url: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 4,
          request_status: "available",
        },
        15: {
          item_id: 15,
          name: "Electric Kettle",
          image_url: "https://images.unsplash.com/photo-1563822249548-9a72b6409252?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 2,
          request_status: "available",
        },
        16: {
          item_id: 16,
          name: "Camping Tent",
          image_url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 5,
          request_status: "available",
        },
        17: {
          item_id: 17,
          name: "Electric Drill",
          image_url: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 1,
          request_status: "borrowed",
        },
        18: {
          item_id: 18,
          name: "Cookbook",
          image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
          category: "Books",
          owner_id: 3,
          request_status: "available",
        },
        19: {
          item_id: 19,
          name: "Smartwatch",
          image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=400&fit=crop",
          category: "Electronics",
          owner_id: 4,
          request_status: "available",
        },
        20: {
          item_id: 20,
          name: "Pressure Washer",
          image_url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 2,
          request_status: "available",
        },
        21: {
          item_id: 21,
          name: "Laptop Stand",
          image_url: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
          category: "Electronics",
          owner_id: 5,
          request_status: "available",
        },
        22: {
          item_id: 22,
          name: "Garden Hose",
          image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
          category: "Tools",
          owner_id: 1,
          request_status: "available",
        },
        23: {
          item_id: 23,
          name: "Vacuum Cleaner",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 4,
          request_status: "available",
        },
        24: {
          item_id: 24,
          name: "Cordless Vacuum",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30002?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 3,
          request_status: "available",
        },
        25: {
          item_id: 25,
          name: "Robot Vacuum",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30003?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 5,
          request_status: "borrowed",
        },
        26: {
          item_id: 26,
          name: "Handheld Vacuum",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30004?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 2,
          request_status: "borrowed",
        },
        27: {
          item_id: 27,
          name: "Shop Vacuum",
          image_url: "https://images.unsplash.com/photo-1558317374-067fb5f30005?w=400&h=400&fit=crop",
          category: "Home",
          owner_id: 1,
          request_status: "available",
        },
      };
      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(sampleItems));
      nextItemId = 28;
    } else {
      const items = JSON.parse(itemsExisting) as Record<number, Item>;
      const ids = Object.keys(items).map((k) => parseInt(k));
      nextItemId = Math.max(...ids) + 1;
    }

    // Initialize borrow requests if not already done
    const requestsExisting = await AsyncStorage.getItem(BORROW_REQUESTS_KEY);
    if (!requestsExisting) {
      const sampleRequests: Record<number, BorrowRequest> = {
        1: {
          request_id: 1,
          user_id: 3, // Bryn
          item_id: 1, // USB-C Charger
          request_datetime: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
          status: "approved",
        },
        2: {
          request_id: 2,
          user_id: 3, // Bryn
          item_id: 2, // Office Chair
          request_datetime: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
          status: "pending",
        },
        3: {
          request_id: 3,
          user_id: 3, // Bryn
          item_id: 3, // Garden Tractor
          request_datetime: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
          status: "approved",
        },
      };
      await AsyncStorage.setItem(BORROW_REQUESTS_KEY, JSON.stringify(sampleRequests));
      nextRequestId = 4;
    } else {
      const requests = JSON.parse(requestsExisting) as Record<number, BorrowRequest>;
      const ids = Object.keys(requests).map((k) => parseInt(k));
      nextRequestId = Math.max(...ids) + 1;
    }

    // Initialize chats if not already done
    const chatsExisting = await AsyncStorage.getItem(CHATS_KEY);
    if (!chatsExisting) {
      const sampleChats: Record<number, Chat> = {
        1: {
          chat_id: 1,
          user1_id: 3, // Bryn
          user2_id: 1, // Alice (Bryn Lamppa in UI)
          last_message: "Perfect! I need the book for CS 262 😄",
          last_message_time: Date.now() - 2 * 60 * 1000, // 2 minutes ago
          unread_count: 2,
        },
        2: {
          chat_id: 2,
          user1_id: 3,
          user2_id: 2, // Bob (Helen Lee in UI)
          last_message: "How long can I borrow the chair for?",
          last_message_time: Date.now() - 60 * 60 * 1000, // 1 hour ago
          unread_count: 1,
        },
        3: {
          chat_id: 3,
          user1_id: 3,
          user2_id: 4, // Charlie (Laila Smith in UI)
          last_message: "Thanks for the quick response!",
          last_message_time: Date.now() - 3 * 60 * 60 * 1000, // 3 hours ago
          unread_count: 0,
        },
        4: {
          chat_id: 4,
          user1_id: 3,
          user2_id: 5, // Dana (Chloe Kottwitz in UI)
          last_message: "Can we meet tomorrow at 3pm?",
          last_message_time: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago
          unread_count: 0,
        },
      };
      await AsyncStorage.setItem(CHATS_KEY, JSON.stringify(sampleChats));
      nextChatId = 5;
    } else {
      const chats = JSON.parse(chatsExisting) as Record<number, Chat>;
      const ids = Object.keys(chats).map((k) => parseInt(k));
      nextChatId = Math.max(...ids) + 1;
    }
  } catch (error) {
    console.error("Failed to initialize mock database:", error);
  }
};

/**
 * Send verification code - stores in AsyncStorage
 */
export const sendVerificationCodeLocal = async (email: string): Promise<void> => {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = Date.now();
    const expiresAt = createdAt + 10 * 60 * 1000; // 10 minutes

    // Store code
    const codesJson = await AsyncStorage.getItem(CODES_KEY);
    const codes: Record<string, VerificationCode> = codesJson
      ? JSON.parse(codesJson)
      : {};

    codes[email] = {
      email,
      code,
      created_at: createdAt,
      expires_at: expiresAt,
      verified: false,
    };

    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(codes));

    console.log(`[DB] Verification code sent to ${email}: ${code}`);
    console.log(
      `[DB] Code will expire in 10 minutes (${new Date(expiresAt).toLocaleTimeString()})`
    );
  } catch (error) {
    console.error("Failed to send verification code:", error);
    throw new Error("Failed to send verification code");
  }
};

/**
 * Verify code
 */
export const verifyCodeLocal = async (
  email: string,
  code: string
): Promise<void> => {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const codesJson = await AsyncStorage.getItem(CODES_KEY);
    if (!codesJson) {
      throw new Error("No verification code found for this email");
    }

    const codes: Record<string, VerificationCode> = JSON.parse(codesJson);
    const record = codes[email];

    if (!record) {
      throw new Error("No verification code found for this email");
    }

    // Check if expired
    if (Date.now() > record.expires_at) {
      throw new Error("Verification code has expired");
    }

    // Check if code matches
    if (record.code !== code) {
      throw new Error("Invalid verification code");
    }

    // Mark as verified
    record.verified = true;
    await AsyncStorage.setItem(CODES_KEY, JSON.stringify(codes));

    console.log(`[DB] Code verified successfully for ${email}`);
  } catch (error) {
    console.error("Failed to verify code:", error);
    throw error;
  }
};

/**
 * Get or create user
 */
export const getOrCreateUserLocal = async (email: string): Promise<User> => {
  try {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    const users: Record<number, User> = usersJson ? JSON.parse(usersJson) : {};

    // Check if user exists
    const existingUser = Object.values(users).find((u) => u.email === email);
    if (existingUser) {
      console.log(`[DB] User found: ${existingUser.name}`);
      return existingUser;
    }

    // Create new user
    const newUser: User = {
      user_id: nextUserId++,
      email,
      name: extractNameFromEmail(email),
      profile_picture: undefined,
    };

    users[newUser.user_id] = newUser;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));

    console.log(
      `[DB] New user created: ${newUser.name} (ID: ${newUser.user_id})`
    );
    return newUser;
  } catch (error) {
    console.error("Failed to get or create user:", error);
    throw new Error("Failed to get or create user");
  }
};

/**
 * Get all users (for debugging)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersJson = await AsyncStorage.getItem(USERS_KEY);
    if (!usersJson) return [];
    const users: Record<number, User> = JSON.parse(usersJson);
    return Object.values(users);
  } catch (error) {
    console.error("Failed to get all users:", error);
    return [];
  }
};

/**
 * Get all items
 */
export const getAllItems = async (): Promise<Item[]> => {
  try {
    const itemsJson = await AsyncStorage.getItem(ITEMS_KEY);
    if (!itemsJson) return [];
    const items: Record<number, Item> = JSON.parse(itemsJson);
    return Object.values(items);
  } catch (error) {
    console.error("Failed to get all items:", error);
    return [];
  }
};

/**
 * Get item by ID
 */
export const getItemById = async (itemId: number): Promise<Item | null> => {
  try {
    const itemsJson = await AsyncStorage.getItem(ITEMS_KEY);
    if (!itemsJson) return null;
    const items: Record<number, Item> = JSON.parse(itemsJson);
    return items[itemId] || null;
  } catch (error) {
    console.error("Failed to get item:", error);
    return null;
  }
};

/**
 * Get all borrow requests
 */
export const getAllBorrowRequests = async (): Promise<BorrowRequest[]> => {
  try {
    const requestsJson = await AsyncStorage.getItem(BORROW_REQUESTS_KEY);
    if (!requestsJson) return [];
    const requests: Record<number, BorrowRequest> = JSON.parse(requestsJson);
    return Object.values(requests);
  } catch (error) {
    console.error("Failed to get borrow requests:", error);
    return [];
  }
};

/**
 * Get borrow requests by user ID
 */
export const getBorrowRequestsByUserId = async (userId: number): Promise<BorrowRequest[]> => {
  try {
    const requestsJson = await AsyncStorage.getItem(BORROW_REQUESTS_KEY);
    if (!requestsJson) return [];
    const requests: Record<number, BorrowRequest> = JSON.parse(requestsJson);
    return Object.values(requests).filter((r) => r.user_id === userId);
  } catch (error) {
    console.error("Failed to get borrow requests:", error);
    return [];
  }
};

/**
 * Get borrow request by ID
 */
export const getBorrowRequestById = async (requestId: number): Promise<BorrowRequest | null> => {
  try {
    const requestsJson = await AsyncStorage.getItem(BORROW_REQUESTS_KEY);
    if (!requestsJson) return null;
    const requests: Record<number, BorrowRequest> = JSON.parse(requestsJson);
    return requests[requestId] || null;
  } catch (error) {
    console.error("Failed to get borrow request:", error);
    return null;
  }
};

/**
 * Get chats for a user
 */
export const getChatsByUserId = async (userId: number): Promise<Chat[]> => {
  try {
    const chatsJson = await AsyncStorage.getItem(CHATS_KEY);
    if (!chatsJson) return [];
    const chats: Record<number, Chat> = JSON.parse(chatsJson);
    return Object.values(chats).filter(
      (c) => c.user1_id === userId || c.user2_id === userId
    );
  } catch (error) {
    console.error("Failed to get chats:", error);
    return [];
  }
};

/**
 * Get chat by ID
 */
export const getChatById = async (chatId: number): Promise<Chat | null> => {
  try {
    const chatsJson = await AsyncStorage.getItem(CHATS_KEY);
    if (!chatsJson) return null;
    const chats: Record<number, Chat> = JSON.parse(chatsJson);
    return chats[chatId] || null;
  } catch (error) {
    console.error("Failed to get chat:", error);
    return null;
  }
};

/**
 * Get messages for a chat
 */
export const getMessagesByChatId = async (chatId: number): Promise<Message[]> => {
  try {
    const messagesJson = await AsyncStorage.getItem(MESSAGES_KEY);
    if (!messagesJson) return [];
    const messages: Record<number, Message> = JSON.parse(messagesJson);
    return Object.values(messages)
      .filter((m) => m.chat_id === chatId)
      .sort((a, b) => a.timestamp - b.timestamp);
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
};

/**
 * Reset database (for testing)
 */
export const resetDatabase = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USERS_KEY);
    await AsyncStorage.removeItem(CODES_KEY);
    await AsyncStorage.removeItem(ITEMS_KEY);
    await AsyncStorage.removeItem(BORROW_REQUESTS_KEY);
    await AsyncStorage.removeItem(CHATS_KEY);
    await AsyncStorage.removeItem(MESSAGES_KEY);
    nextUserId = 1;
    nextItemId = 1;
    nextRequestId = 1;
    nextChatId = 1;
    nextMessageId = 1;
    console.log("[DB] Database reset");
    await initialize();
  } catch (error) {
    console.error("Failed to reset mock database:", error);
  }
};

/**
 * Helper function to extract name from email
 */
function extractNameFromEmail(email: string): string {
  const namePart = email.split("@")[0];
  const words = namePart.split(/[._-]/);
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
