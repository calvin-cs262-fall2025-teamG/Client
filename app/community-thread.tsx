import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityMessages, sendCommunityMessage, subscribeToCommunity,
  type CommunityMessage,
} from "../services/chat";

export default function CommunityThread() {
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const { user } = useAuth();
  const myId = String(user?.user_id ?? "");

  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;

    getCommunityMessages(id)
      .then((data) => active && setMessages(data))
      .catch((e) => console.error("Failed to load community messages:", e))
      .finally(() => active && setLoading(false));

    const unsubscribe = subscribeToCommunity(id, (incoming) => {
      setMessages((prev) =>
        prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
      );
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [id]);

  // inverted list wants newest first
  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !id || !user) return;
    setText("");
    try {
      await sendCommunityMessage(id, { id: myId, name: user.name }, content);
    } catch (e) {
      console.error("Failed to send message:", e);
      setText(content);
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const renderMessage = ({ item }: { item: CommunityMessage }) => {
    const mine = item.sender_id === myId;
    return (
      <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!mine && <Text style={styles.sender}>{item.sender_name}</Text>}
          <Text style={mine ? styles.textMine : styles.textTheirs}>{item.content}</Text>
          <Text style={mine ? styles.timeMine : styles.timeTheirs}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
      <Stack.Screen options={{ title: name ?? "Community" }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b1b0d" />
          </View>
        ) : (
          <FlatList
            style={styles.flex}
            data={listData}
            inverted
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>No messages yet. Say hi to your neighbors!</Text>
            }
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Message your community"
            placeholderTextColor="#9ca3af"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, transform: [{ scaleY: -1 }] },

  row: { flexDirection: "row", marginVertical: 3 },
  rowMine: { justifyContent: "flex-end" },
  rowTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: "#3b1b0d" },
  bubbleTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
  sender: { fontSize: 12, fontWeight: "700", color: "#3b1b0d", marginBottom: 2 },
  textMine: { color: "#fff", fontSize: 15 },
  textTheirs: { color: "#111827", fontSize: 15 },
  timeMine: { color: "#d1d5db", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
  timeTheirs: { color: "#9ca3af", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },

  inputBar: {
    flexDirection: "row", alignItems: "flex-end", padding: 8,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1, maxHeight: 100, backgroundColor: "#f3f4f6", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: "#111827",
  },
  sendButton: {
    marginLeft: 8, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "#3b1b0d", justifyContent: "center", alignItems: "center",
  },
  sendDisabled: { opacity: 0.4 },
});