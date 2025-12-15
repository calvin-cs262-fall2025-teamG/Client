import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { messages as messagesApi, users as usersApi } from "../services/api";
import type { ImageSourcePropType } from "react-native";

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
  imageMap: Record<string, any>
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

interface Message {
  message_id: number;
  sender_id: number;
  receiver_id: number;
  item_id?: number;
  content: string;
  sent_at: string;
}

export default function ChatThread() {
  const [otherAvatar, setOtherAvatar] = useState<string | null>(null);

  const { id, name, avatar } = useLocalSearchParams<{
    id?: string;
    name?: string;
    avatar?: string;
  }>();

  const router = useRouter();
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const otherUserId = id ? Number(id) : null;
  const otherAvatarSource = resolveImageSource(otherAvatar, avatarMap);
  const headerInitial = String(name || "Chat").trim().charAt(0).toUpperCase() || "?";

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load messages between current user and other user
  const loadMessages = async () => {
    if (!user?.user_id || !otherUserId) {
      setLoading(false);
      return;
    }

    try {
      const allMessages: any = await messagesApi.getAll();

      // Filter messages between these two users
      const filtered = allMessages.filter(
        (msg: Message) =>
          (msg.sender_id === user.user_id && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === user.user_id)
      );

      setMessages(filtered);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [user, otherUserId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    const loadOtherUser = async () => {
      if (!otherUserId) return;

      try {
        const u: any = await usersApi.getById(otherUserId);
        console.log("OTHER USER profile_picture:", u?.profile_picture);
        setOtherAvatar(u?.profile_picture ?? null);
      } catch (e) {
        console.error("Failed to load other user:", e);
      }
    };

    // Use avatar from params first, otherwise load from API
    if (avatar && avatar.trim()) {
      setOtherAvatar(avatar);
    } else {
      loadOtherUser();
    }
  }, [otherUserId, avatar]);



  const handleSend = async () => {
    if (!inputText.trim() || !user?.user_id || !otherUserId || sending) return;

    setSending(true);

    try {
      const newMessage = await messagesApi.create({
        sender_id: user.user_id,
        receiver_id: otherUserId,
        content: inputText.trim(),
      });

      // Reload messages to get the new one
      await loadMessages();

      setInputText("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMessageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffMs = startOfToday.getTime() - startOfMessageDay.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    if (diffDays === 0) return `Today • ${timeStr}`;
    if (diffDays === 1) return `Yesterday • ${timeStr}`;
    if (diffDays < 7) return `${diffDays} days ago • ${timeStr}`;
    if (diffDays < 14) return `1 week ago • ${timeStr}`;
    return `${Math.floor(diffDays / 7)} weeks ago • ${timeStr}`;
  };

  if (loading) {
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
              <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
                <Text style={styles.headerAvatarText}>{headerInitial}</Text>
              </View>
            )}

            <View>
              <Text style={styles.headerTitle}>{name || "Chat"}</Text>
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
            <Text style={styles.headerTitle}>{name || "Chat"}</Text>
            <Text style={styles.headerSubtitle}>Active now</Text>
          </View>
        </View>


        <View style={{ width: 24 }} />
      </View>

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
              <Text style={styles.emptySub}>Send a message to start the conversation</Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender_id === user?.user_id;

              return (
                <View key={msg.message_id}>
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
                    {formatTime(msg.sent_at)}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

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