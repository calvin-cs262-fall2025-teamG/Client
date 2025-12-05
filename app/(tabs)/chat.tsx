import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, getChatsByUserId, User } from "../../lib/api";

const jacobImage = require("../../assets/images/jacob.png");
const helenImage = require("../../assets/images/helen.png");
const lailaImage = require("../../assets/images/laila.png");
const chloeImage = require("../../assets/images/chloe.png");
const gregImage = require("../../assets/images/greg.png");
const brynImage = require("../../assets/images/bryn.png");

type ChatItem = {
  id: number;
  name: string;
  avatar: any;
  lastMessage: string;
  time: string;
  unread?: number;
  userId: number;
};

// Helper to format timestamps
const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / (60 * 1000));
  const hours = Math.floor(diff / (60 * 60 * 1000));
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

// Map user IDs to local avatar images
const avatarMap: Record<number, any> = {
  1: brynImage,
  2: helenImage,
  3: brynImage,
  4: lailaImage,
  5: chloeImage,
};

export default function Chat() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load chats from API
  useEffect(() => {
    const loadChats = async () => {
      try {
        if (!user?.user_id) return;

        const [userChats, allUsers] = await Promise.all([
          getChatsByUserId(user.user_id),
          getAllUsers(),
        ]);

        const userMap: Record<number, User> = {};
        allUsers.forEach((u) => {
          userMap[u.user_id] = u;
        });

        const chatItems: ChatItem[] = userChats.map((chat) => {
          const otherUserId = chat.user1_id === user.user_id ? chat.user2_id : chat.user1_id;
          const otherUser = userMap[otherUserId];
          
          return {
            id: chat.chat_id,
            name: otherUser?.name || "Unknown User",
            avatar: avatarMap[otherUserId] || brynImage,
            lastMessage: chat.last_message || "No messages yet",
            time: chat.last_message_time ? formatTime(chat.last_message_time) : "",
            unread: chat.unread_count,
            userId: otherUserId,
          };
        });

        setChats(chatItems);
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [user]);

  // 🔍 FILTER CHATS LIVE
  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CHAT LIST */}
      <ScrollView style={styles.chatList}>
        {filteredChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={styles.chatItem}
            onPress={() =>
              router.push({
                pathname: "/chat-thread",
                params: { id: chat.id, name: chat.name },
              })
            }
          >
            <Image source={chat.avatar} style={styles.avatarImage} />

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>

              <View style={styles.messageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {chat.lastMessage}
                </Text>

                {chat.unread && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{chat.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {filteredChats.length === 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#6b7280" }}>No chats found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export const options = {
  headerShown: false,
};

// STYLES
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  chatList: {
    flex: 1,
  },

  chatItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    alignItems: "center",
  },

  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },

  chatContent: {
    flex: 1,
  },

  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  chatTime: {
    fontSize: 12,
    color: "#6b7280",
  },

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },

  unreadBadge: {
    marginLeft: 8,
    backgroundColor: "#f97316",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
