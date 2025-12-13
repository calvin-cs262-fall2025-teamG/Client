import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  if (/^https?:\/\//i.test(key)) return { uri: key };
  return avatarMap[key.toLowerCase()];
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
  const [nameCache, setNameCache] = useState<Record<number, string>>({});

  const loadChats = async () => {
    if (!user?.user_id) return;
    setLoading(true);

    try {
      const data = (await messagesApi.getUserMessages(
        user.user_id
      )) as ChatPreview[];

      setChats(data);

      const userPromises = data.map(async (chat) => {
        try {
          const u: any = await usersApi.getById(chat.other_user_id);
          return {
            id: chat.other_user_id,
            name: u?.name ?? u?.username,
            avatar: u?.profile_picture,
          };
        } catch {
          return null;
        }
      });

      const results = await Promise.all(userPromises);
      const names: Record<number, string> = {};
      const avatars: Record<number, string> = {};

      results.forEach((r) => {
        if (!r) return;
        if (r.name) names[r.id] = r.name;
        if (r.avatar) avatars[r.id] = r.avatar;
      });

      setNameCache((p) => ({ ...p, ...names }));
      setAvatarCache((p) => ({ ...p, ...avatars }));
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

  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.other_user_name.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
    );
  }, [searchQuery, chats]);

  const getTimeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "now";
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}d`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* CHATS HEADER (IN-SCREEN) */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Chats</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* SEARCH BAR (MATCHES SEARCH TAB) */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* CHAT LIST */}
        {filteredChats.map((chat) => {
          const name = nameCache[chat.other_user_id] || chat.other_user_name;
          const avatarKey =
            avatarCache[chat.other_user_id] || chat.other_user_avatar;
          const avatarSource = resolveImageSource(avatarKey);

          return (
            <TouchableOpacity
              key={chat.message_id}
              style={styles.chatCard}
              onPress={() =>
                router.push({
                  pathname: "/chat-thread",
                  params: {
                    id: chat.other_user_id,
                    name,
                    avatar: avatarKey ?? "",
                  },
                })
              }
            >
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {name?.[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.row}>
                  <Text style={styles.name}>{name}</Text>
                  <Text style={styles.time}>{getTimeAgo(chat.sent_at)}</Text>
                </View>

                <Text style={styles.preview} numberOfLines={1}>
                  {chat.sender_id === user?.user_id ? "You: " : ""}
                  {chat.content}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  scrollContent: {
    paddingBottom: 18,
  },

  /* --- HEADER --- */
  header: {
    paddingTop: 6,
    paddingBottom: 6,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3b2a22",
  },

  headerDivider: {
    marginTop: 10,
    height: 1,
    width: "100%",
    backgroundColor: "#e5e7eb",
  },

  /* --- SEARCH --- */
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 8,       // tighter than 10
    marginBottom: 6,    // prevents extra blank space
    paddingHorizontal: 16,
    paddingVertical: 10, // slightly shorter
    borderRadius: 30,
    alignItems: "center",
  },

  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  /* --- CHAT CARDS --- */
  chatCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8, // tighter than 14 (removes the big gap feeling)
    padding: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    alignItems: "center",
    elevation: 2,
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
  },

  avatarFallback: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6b7280",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  time: {
    fontSize: 12,
    color: "#9ca3af",
  },

  preview: {
    marginTop: 4,
    fontSize: 14,
    color: "#6b7280",
  },
});
