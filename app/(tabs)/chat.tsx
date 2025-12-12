import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { messages as messagesApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface ChatPreview {
  message_id: number;
  other_user_id: number;
  other_user_name: string;
  other_user_avatar: string | null;
  content: string;
  sent_at: string;
  sender_id: number;
  receiver_id: number;
}

export default function Chat() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = async () => {
    if (!user?.user_id) return;

    try {
      const data: any = await messagesApi.getUserMessages(user.user_id);
      setChats(data);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChats();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  // 🔍 FILTER CHATS LIVE
  const filteredChats = useMemo(() => {
    return chats.filter(
      (chat) =>
        chat.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, chats]);

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
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
      <ScrollView
        style={styles.chatList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredChats.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No chats found" : "No messages yet"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery ? "Try a different search" : "Start borrowing items to chat with neighbors"}
            </Text>
          </View>
        ) : (
          filteredChats.map((chat) => (
            <TouchableOpacity
              key={chat.message_id}
              style={styles.chatItem}
              onPress={() =>
                router.push({
                  pathname: "/chat-thread",
                  params: {
                    id: chat.other_user_id,
                    name: chat.other_user_name,
                  },
                })
              }
            >
              {chat.other_user_avatar ? (
                <Image
                  source={{ uri: chat.other_user_avatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={28} color="#9ca3af" />
                </View>
              )}

              <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatName}>{chat.other_user_name}</Text>
                  <Text style={styles.chatTime}>{getTimeAgo(chat.sent_at)}</Text>
                </View>

                <View style={styles.messageRow}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.sender_id === user?.user_id ? "You: " : ""}
                    {chat.content}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#4b5563",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
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
  avatarPlaceholder: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
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