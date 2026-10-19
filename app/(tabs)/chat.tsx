import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import type { ImageSourcePropType } from "react-native";
import {
  community_messages,
  direct_messages,
  profiles,
  type CommunityMessage,
  type DirectMessage,
  type Profile,
} from "../../services/supabase_api";
import {
  isUnread,
  loadLastRead,
  saveLastRead,
  type LastReadMap,
} from "../../services/readState";

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

/* ---------------- HELPERS ---------------- */

function resolveImageSource(
  key: string | null | undefined,
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

const otherUserId = (message: DirectMessage, myId: string) =>
  message.sender_id === myId ? message.receiver_id : message.sender_id;

// A failed lookup leaves the id out, so the row falls back to "Unknown".
async function loadProfiles(ids: string[]): Promise<Record<string, Profile>> {
  const results = await Promise.all(
    ids.map(async (id) => {
      const { data, error } = await profiles.getById(id);
      if (error) console.error(`Failed to load profile ${id}:`, error);
      return data;
    }),
  );
  const byId: Record<string, Profile> = {};
  results.forEach((p) => {
    if (p) byId[p.id] = p;
  });
  return byId;
}

/* ---------------- TIME FORMAT ---------------- */

function getTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  return `${days}d`;
}

/* ---------------- SCREEN ---------------- */

export default function Chat() {
  const router = useRouter();
  const { user } = useAuth();
  const { myCommunities, refresh: refreshDatabase } = useDatabase();
  const userId = user?.id;

  const [searchQuery, setSearchQuery] = useState("");
  // Latest message of each DM conversation, newest first
  const [chats, setChats] = useState<DirectMessage[]>([]);
  const [latestByCommunity, setLatestByCommunity] = useState<
    Record<string, CommunityMessage>
  >({});
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [lastRead, setLastRead] = useState<LastReadMap>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const requestId = useRef(0);

  /* -------- LOAD CHATS -------- */

  const loadChats = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const id = ++requestId.current;

    try {
      const [conversations, latest, read] = await Promise.all([
        direct_messages.getConversations(),
        Promise.all(
          myCommunities.map((c) =>
            community_messages.getByCommunity(c.id, { limit: 1 }),
          ),
        ),
        loadLastRead(userId),
      ]);
      if (conversations.error) throw conversations.error;

      const dms = conversations.data ?? [];
      const latestMap: Record<string, CommunityMessage> = {};
      latest.forEach((result, i) => {
        if (result.error) {
          console.error("Failed to load community messages:", result.error);
          return;
        }
        const newest = result.data?.[0];
        if (newest) latestMap[myCommunities[i].id] = newest;
      });

      const ids = new Set<string>();
      dms.forEach((m) => ids.add(otherUserId(m, userId)));
      Object.values(latestMap).forEach((m) => ids.add(m.sender_id));
      ids.delete(userId);
      const profileMap = await loadProfiles([...ids]);

      if (id !== requestId.current) return;
      setChats(dms);
      setLatestByCommunity(latestMap);
      setPeople(profileMap);
      setLastRead(read);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [userId, myCommunities]);

  // Runs on mount and on every return to this tab, so new messages and
  // read state saved by a thread screen show up.
  useFocusEffect(
    useCallback(() => {
      void loadChats();
    }, [loadChats]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDatabase(), loadChats()]);
    setRefreshing(false);
  };

  // Opening a DM shows its newest message, so record it as seen right away.
  const markDmRead = async (otherId: string, createdAt: string) => {
    if (!userId) return;
    const key = `dm:${otherId}`;
    setLastRead((prev) => ({ ...prev, [key]: createdAt }));
    // Reload before saving so a thread's own save isn't overwritten.
    const saved = await loadLastRead(userId);
    await saveLastRead(userId, { ...saved, [key]: createdAt });
  };

  /* -------- FILTER -------- */

  const nameOf = useCallback(
    (id: string) => people[id]?.display_name ?? "Unknown",
    [people],
  );

  const filteredChats = useMemo(() => {
    if (!userId) return [];
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        nameOf(otherUserId(chat, userId)).toLowerCase().includes(q) ||
        chat.content.toLowerCase().includes(q),
    );
  }, [searchQuery, chats, nameOf, userId]);

  const filteredCommunities = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return myCommunities.filter((c) => c.name.toLowerCase().includes(q));
  }, [searchQuery, myCommunities]);

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

  const myId = userId ?? "";

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
        {filteredCommunities.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Communities</Text>
            {filteredCommunities.map((c) => {
              const last = latestByCommunity[c.id] ?? null;
              const unread = isUnread(lastRead, `community:${c.id}`, last, myId);
              const sender = last
                ? last.sender_id === myId
                  ? "You"
                  : nameOf(last.sender_id)
                : null;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.chatItem}
                  onPress={() =>
                    router.push({
                      pathname: "/community-thread",
                      params: { id: c.id, name: c.name },
                    })
                  }
                >
                  <View style={[styles.avatarImage, styles.communityIcon]}>
                    <Ionicons name="people" size={26} color="#fff" />
                  </View>
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.chatName}>{c.name}</Text>
                      {last && (
                        <Text style={styles.chatTime}>{getTimeAgo(last.created_at)}</Text>
                      )}
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {last ? `${sender}: ${last.content}` : "No messages yet"}
                    </Text>
                  </View>
                  {unread && <View style={styles.unreadDot} />}
                </TouchableOpacity>
              );
            })}
            <Text style={styles.sectionHeader}>Recent messages</Text>
          </View>
        )}
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
            const otherId = otherUserId(chat, myId);
            const otherName = nameOf(otherId);
            const avatarKey = people[otherId]?.avatar_path ?? null;
            const avatarSource = resolveImageSource(avatarKey);
            const initial = otherName.trim()[0]?.toUpperCase() ?? "?";
            const unread = isUnread(lastRead, `dm:${otherId}`, chat, myId);

            return (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => {
                  void markDmRead(otherId, chat.created_at);
                  router.push({
                    pathname: "/chat-thread",
                    params: {
                      id: otherId,
                      name: otherName,
                      avatar: avatarKey ?? "",
                    },
                  });
                }}
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
                    <Text style={styles.chatName}>{otherName}</Text>
                    <Text style={styles.chatTime}>
                      {getTimeAgo(chat.created_at)}
                    </Text>
                  </View>

                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {chat.sender_id === myId ? "You: " : ""}
                    {chat.content}
                  </Text>
                </View>
                {unread && <View style={styles.unreadDot} />}
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

  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  communityIcon: {
    backgroundColor: "#3b1b0d",
    justifyContent: "center",
    alignItems: "center",
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f97316",
    marginLeft: 8,
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
