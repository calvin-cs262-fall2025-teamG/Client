import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useRef, useCallback } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { useBorrowing } from "../context/BorrowingContext";
import { useItems } from "../context/ItemsContext";
import { useProfile } from "../context/ProfileContext";
import {
  newestFirst,
  requestStage,
  STAGE_LABELS,
} from "../services/borrowingStatus";
import {
  direct_messages,
  items as itemsApi,
  type DirectMessage,
  type Item,
  type Profile,
} from "../services/supabase_api";
import {
  loadLastRead,
  parseTimestamp,
  saveLastRead,
} from "../services/readState";

const avatarMap: Record<string, any> = {
  "helen.png": require("../assets/images/helen.png"),
  "jacob.png": require("../assets/images/jacob.png"),
  "greg.png": require("../assets/images/greg.png"),
  "rose.png": require("../assets/images/rose.png"),
  "bryn.png": require("../assets/images/bryn.png"),
  "laila.png": require("../assets/images/laila.png"),
  "chloe.png": require("../assets/images/chloe.png"),
};

function resolveImageSource(
  key: string | null | undefined,
  imageMap: Record<string, any>,
): ImageSourcePropType | undefined {
  if (!key) return undefined;
  const trimmed = key.trim();
  if (!trimmed) return undefined;

  // Remote URL
  if (/^https?:\/\//i.test(trimmed)) return { uri: trimmed };

  // Local bundled filename
  const lower = trimmed.toLowerCase();
  return imageMap[lower];
}

export default function ChatThread() {
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);

  const { id, name, avatar, draft, itemId } = useLocalSearchParams<{
    id?: string;
    name?: string;
    avatar?: string;
    draft?: string;
    itemId?: string;
  }>();

  const router = useRouter();
  const { user } = useAuth();
  const { getProfile } = useProfile();
  const {
    myRequests,
    incomingRequests,
    borrowingHistory,
    refresh: refreshBorrowing,
  } = useBorrowing();
  const { myItems } = useItems();
  const scrollViewRef = useRef<ScrollView>(null);
  // Attach the item to the first message sent from this screen only
  const pendingItemIdRef = useRef(itemId || undefined);

  const otherUserId = id || null;
  // Use name and avatar from params first, otherwise the loaded profile's
  const otherName = name?.trim() ? name : otherProfile?.display_name;
  const otherAvatar = avatar?.trim() ? avatar : otherProfile?.avatar_path;
  const otherAvatarSource = resolveImageSource(otherAvatar, avatarMap);
  const headerInitial =
    String(otherName || "Chat")
      .trim()
      .charAt(0)
      .toUpperCase() || "?";

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  // A draft from the route only prefills the input; nothing is sent automatically
  const [inputText, setInputText] = useState(draft ?? "");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load messages between current user and other user
  const userId = user?.id;

  const loadMessages = useCallback(async () => {
    if (!userId || !otherUserId) return;

    try {
      const { data, error } = await direct_messages.getConversation(otherUserId);
      if (error) throw error;

      // Oldest first
      const sorted = [...(data ?? [])].sort(
        (a, b) => parseTimestamp(a.created_at) - parseTimestamp(b.created_at),
      );

      setMessages(sorted);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, otherUserId]);

  useEffect(() => {
    // Loader only sets state after awaiting the API, so this doesn't cascade renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    if (!otherUserId) return;

    const loadOtherUser = async () => {
      try {
        setOtherProfile(await getProfile(otherUserId));
      } catch (e) {
        console.error("Failed to load other user:", e);
      }
    };

    loadOtherUser();
  }, [otherUserId, getProfile]);

  // A request may have been approved on the other person's device
  useEffect(() => {
    void refreshBorrowing();
  }, [refreshBorrowing]);

  // The item this conversation is about: the route's, else the newest message's
  const conversationItemId =
    itemId ||
    [...messages].reverse().find((m) => m.item_id)?.item_id ||
    undefined;

  // They asked to borrow my item
  const lenderRequest = conversationItemId
    ? incomingRequests
        .filter(
          (r) =>
            r.item_id === conversationItemId && r.requester_id === otherUserId,
        )
        .sort(newestFirst)[0]
    : undefined;
  // I asked for this item; only counts if it belongs to the person I'm talking to
  const myRequestForItem = conversationItemId
    ? myRequests
        .filter((r) => r.item_id === conversationItemId)
        .sort(newestFirst)[0]
    : undefined;

  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const fetchItemId =
    !lenderRequest && myRequestForItem ? conversationItemId : undefined;
  useEffect(() => {
    if (!fetchItemId) return;
    let active = true;
    Promise.resolve(itemsApi.getById(fetchItemId))
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setFetchedItem(data ?? null);
      })
      .catch((e) => console.error("Failed to load item:", e));
    return () => {
      active = false;
    };
  }, [fetchItemId]);

  const borrowerRequest =
    myRequestForItem &&
    fetchedItem &&
    fetchedItem.id === conversationItemId &&
    fetchedItem.owner_id === otherUserId
      ? myRequestForItem
      : undefined;
  const pinned = lenderRequest ?? borrowerRequest;
  const isLender = !!lenderRequest;
  const pinnedItemName = isLender
    ? myItems.find((i) => i.id === conversationItemId)?.name
    : fetchedItem?.name;
  const stage = pinned ? requestStage(pinned, borrowingHistory) : undefined;

  const displayOtherName = otherName || "Neighbor";
  // Where the approval note goes: before the first message sent after the decision
  const decidedMs =
    pinned?.status === "approved" && pinned.decided_at
      ? parseTimestamp(pinned.decided_at)
      : null;
  const noteIndex =
    decidedMs === null
      ? -1
      : (() => {
          const i = messages.findIndex(
            (m) => parseTimestamp(m.created_at) > decidedMs,
          );
          return i === -1 ? messages.length : i;
        })();
  const approvalNote = (
    <View style={styles.systemNote} testID="approval-note">
      <Ionicons name="checkmark-circle" size={14} color="#2f7d4f" />
      <Text style={styles.systemNoteText}>
        {isLender
          ? `You approved ${displayOtherName}'s request`
          : `${displayOtherName} approved your request`}
      </Text>
    </View>
  );

  const showChips = !isLender && stage === "out";
  const QUICK_REPLIES = [
    { label: "When can I pick it up?", text: "When can I pick it up?" },
    // Leaves the date for the borrower to type
    { label: "I’ll return it by …", text: "I’ll return it by " },
  ];

  // Record the newest message on screen as seen, on load and after sending.
  const newest = messages[messages.length - 1]?.created_at;
  useEffect(() => {
    if (!userId || !otherUserId || !newest) return;
    const key = `dm:${otherUserId}`;
    loadLastRead(userId)
      .then((map) => saveLastRead(userId, { ...map, [key]: newest }))
      .catch((e) => console.error("Failed to save read state:", e));
  }, [userId, otherUserId, newest]);

  const handleSend = async () => {
    const content = inputText.trim();
    if (!content || !userId || !otherUserId || sending) return;

    setSending(true);

    try {
      const pendingItemId = pendingItemIdRef.current;
      const { data, error } = await direct_messages.create({
        receiver_id: otherUserId,
        content,
        ...(pendingItemId ? { item_id: pendingItemId } : {}),
      });
      if (error) throw error;
      pendingItemIdRef.current = undefined;

      if (data) {
        setMessages((prev) =>
          prev.some((m) => m.id === data.id) ? prev : [...prev, data],
        );
      }

      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (createdAt: string) => {
    const date = new Date(parseTimestamp(createdAt));
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfMessageDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffMs = startOfToday.getTime() - startOfMessageDay.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const timeStr = date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    if (diffDays === 0) return `Today • ${timeStr}`;
    if (diffDays === 1) return `Yesterday • ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago • ${timeStr}`;
    if (diffDays < 14) return `1 week ago • ${timeStr}`;
    return `${Math.floor(diffDays / 7)} weeks ago • ${timeStr}`;
  };

  if (loading && userId && otherUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerUserBlock}>
            {otherAvatarSource ? (
              <Image source={otherAvatarSource} style={styles.headerAvatar} />
            ) : (
              <View
                style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}
              >
                <Text style={styles.headerAvatarText}>{headerInitial}</Text>
              </View>
            )}

            <View>
              <Text style={styles.headerTitle}>{otherName || "Chat"}</Text>
              <Text style={styles.headerSubtitle}>Active now</Text>
            </View>
          </View>

          <View style={{ width: 24 }} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerUserBlock}>
          {otherAvatarSource ? (
            <Image source={otherAvatarSource} style={styles.headerAvatar} />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
              <Text style={styles.headerAvatarText}>{headerInitial}</Text>
            </View>
          )}

          <View>
            <Text style={styles.headerTitle}>{otherName || "Chat"}</Text>
            <Text style={styles.headerSubtitle}>Active now</Text>
          </View>
        </View>

        <View style={{ width: 24 }} />
      </View>

      {pinned && (
        <View style={styles.pinned} testID="pinned-item">
          <View style={styles.pinnedThumb}>
            <Ionicons name="cube-outline" size={20} color="#E8792F" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pinnedName} numberOfLines={1}>
              {pinnedItemName ?? "Item"}
            </Text>
            <Text style={styles.pinnedStatus}>
              {stage ? STAGE_LABELS[stage] : ""}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push(`/request/${pinned.id}`)}
            accessibilityRole="link"
            accessibilityLabel="Details"
          >
            <Text style={styles.pinnedLink}>Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BODY */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySub}>
                Send a message to start the conversation
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => {
              const isUser = msg.sender_id === user?.id;

              return (
                <View key={msg.id}>
                  {index === noteIndex && approvalNote}
                  <View
                    style={[
                      styles.messageBubble,
                      isUser ? styles.userBubble : styles.listerBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        isUser && styles.messageTextUser,
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.timestamp,
                      isUser ? styles.timestampRight : styles.timestampLeft,
                    ]}
                  >
                    {formatTime(msg.created_at)}
                  </Text>
                </View>
              );
            })
          )}
          {noteIndex === messages.length && approvalNote}
        </ScrollView>

        {showChips && (
          <View style={styles.chipRow}>
            {QUICK_REPLIES.map((reply) => (
              <TouchableOpacity
                key={reply.label}
                style={styles.chip}
                onPress={() => setInputText(reply.text)}
                disabled={sending}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{reply.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* INPUT BAR */}
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor="#b5b5b5"
            style={styles.textInput}
            multiline
            editable={!sending}
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fefefe" },
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#9ca3af",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f97316",
  },
  headerUserBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerAvatarPlaceholder: {
    backgroundColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#ffe6d5",
    fontSize: 12,
    marginTop: 1,
  },
  backButton: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    paddingRight: 10,
  },
  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 30 },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: "75%",
    marginBottom: 4,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#f97316",
    borderBottomRightRadius: 6,
  },
  listerBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    borderBottomLeftRadius: 6,
  },
  messageText: {
    color: "#1a1a1a",
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextUser: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 14,
  },
  timestampLeft: { alignSelf: "flex-start", marginLeft: 6 },
  timestampRight: { alignSelf: "flex-end", marginRight: 6 },
  pinned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FBEBD9",
  },
  pinnedThumb: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedName: { fontSize: 15, fontWeight: "700", color: "#3b1b0d" },
  pinnedStatus: { fontSize: 12, color: "#7c5f52", marginTop: 1 },
  pinnedLink: { fontSize: 14, fontWeight: "700", color: "#E8792F" },
  systemNote: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e4f4e9",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 10,
  },
  systemNoteText: { fontSize: 12, fontWeight: "600", color: "#2f7d4f" },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: "#fff",
  },
  chip: {
    borderWidth: 1,
    borderColor: "#E8792F",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#E8792F" },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: "#f97316",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#d6d6d6",
  },
  sendIcon: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 2,
  },
});
