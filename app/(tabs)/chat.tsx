import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { messages as messagesApi, users as usersApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { ImageSourcePropType } from "react-native";

/* ---------------- AVATAR MAP ---------------- */

const avatarMap: Record<string, any> = {
  "helen.png": require("../../assets/images/helen.png"),
  "jacob.png": require("../../assets/images/jacob.png"),
  "greg.png": require("../../assets/images/greg.png"),
  "rose.png": require("../../assets/images/rose.png"),
  "bryn.png": require("../../assets/images/bryn.png"),
  "laila.png": require("../../assets/images/laila.png"),
  "chloe.png": require("../../assets/images/chloe.png"),
};

/* ---------------- TYPES ---------------- */

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

/* ---------------- HELPERS ---------------- */

function resolveImageSource(
  key: string | null | undefined
): ImageSourcePropType | undefined {
  if (!key) return undefined;
  const trimmed = key.trim();
  if (!trimmed) return undefined;

  if (/^https?:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }

  const lower = trimmed.toLowerCase();
  return avatarMap[lower];
}

/* ---------------- SCREEN ---------------- */

export default function Chat() {
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [avatarCache, setAvatarCache] = useState<Record<number, string>>({});

  /* -------- LOAD CHATS -------- */

  const loadChats = async () => {
    if (!user?.user_id) return;

    try {
      const data: any = await messagesApi.getUserMessages(user.user_id);

      // Sort chats by most recent first
      const sortedChats = data.sort((a: ChatPreview, b: ChatPreview) => {
        return new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime();
      });

      setChats(sortedChats);

      // Load avatars for ALL users to ensure we have them
      const avatarPromises = data.map(async (chat: ChatPreview) => {
        try {
          const userData: any = await usersApi.getById(chat.other_user_id);
          return { userId: chat.other_user_id, avatar: userData?.profile_picture };
        } catch (error) {
          console.error(`Failed to load avatar for user ${chat.other_user_id}:`, error);
          return null;
        }
      });

      const avatarResults = await Promise.all(avatarPromises);
      const newAvatarCache: Record<number, string> = {};

      avatarResults.forEach((result) => {
        if (result && result.avatar) {
          newAvatarCache[result.userId] = result.avatar;
        }
      });

      setAvatarCache(prev => ({ ...prev, ...newAvatarCache }));
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

  /* -------- FILTER -------- */

  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.other_user_name.toLowerCase().includes(q) ||
        chat.content.toLowerCase().includes(q)
    );
  }, [searchQuery, chats]);

  /* -------- TIME FORMAT -------- */

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  /* -------- LOADING -------- */

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------------- RENDER ---------------- */

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#6b7280" />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>
              {searchQuery ? "No chats found" : "No messages yet"}
            </Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? "Try a different search"
                : "Start borrowing items to chat with neighbors"}
            </Text>
          </View>
        ) : (
          filteredChats.map((chat) => {
            // Prioritize cached avatar (full URL) over chat data (filename only)
            const avatarKey = avatarCache[chat.other_user_id] || chat.other_user_avatar;
            const avatarSource = resolveImageSource(avatarKey);
            const initial =
              chat.other_user_name?.trim()?.[0]?.toUpperCase() ?? "?";

            return (
              <TouchableOpacity
                key={chat.message_id}
                style={styles.chatItem}
                onPress={() =>
                  router.push({
                    pathname: "/chat-thread",
                    params: {
                      id: chat.other_user_id,
                      name: chat.other_user_name,
                      avatar: avatarKey ?? "",
                    },
                  })
                }
              >
                {avatarSource ? (
                  <Image source={avatarSource} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarInitial}>{initial}</Text>
                  </View>
                )}

                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>
                      {chat.other_user_name}
                    </Text>
                    <Text style={styles.chatTime}>
                      {getTimeAgo(chat.sent_at)}
                    </Text>
                  </View>

                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.sender_id === user?.user_id ? "You: " : ""}
                    {chat.content}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },

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

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
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

  avatarInitial: {
    fontSize: 20,
    fontWeight: "800",
    color: "#6b7280",
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

  lastMessage: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
});