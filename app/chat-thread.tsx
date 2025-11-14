import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatThread() {
  const router = useRouter();
  const { name, avatar } = useLocalSearchParams();
  const avatarNumber = avatar ? Number(avatar) : null;


  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! I saw your listing for the Core 100 textbook. Is it still available?",
      isUser: false,
      timestamp: "Yesterday 3:24 PM",
    },
    {
      id: 2,
      text: "Yes it is! Are you interested?",
      isUser: true,
      timestamp: "Yesterday 3:30 PM",
    },
  ]);

  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {avatarNumber && (
            <Image
              source={avatarNumber}
              style={{ width: 32, height: 32, borderRadius: 16, marginBottom: 4 }}
            />
          )}

          <Text style={styles.headerTitle}>{name || "Chat"}</Text>
          <Text style={styles.headerSubtitle}>Active now</Text>
        </View>

        <TouchableOpacity style={styles.moreButton}>
          <Text style={styles.moreIcon}>⋯</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              <View
                style={[
                  styles.messageBubble,
                  msg.isUser
                    ? styles.messageBubbleRight
                    : styles.messageBubbleLeft,
                ]}
              >
                <Text
                  style={msg.isUser ? styles.messageTextRight : styles.messageText}
                >
                  {msg.text}
                </Text>
              </View>

              <Text
                style={[
                  styles.timestamp,
                  msg.isUser ? styles.timestampRight : styles.timestampLeft,
                ]}
              >
                {msg.timestamp}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* INPUT FIELD */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.plusButton}>
            <Text style={styles.plusIcon}>➕</Text>
          </TouchableOpacity>

          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            style={styles.textInput}
            multiline
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendText}>📨</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  keyboardView: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#15803d",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: { color: "#fff", fontSize: 24, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerSubtitle: { color: "#d1fae5", fontSize: 12, marginTop: 2 },
  moreButton: { paddingLeft: 14 },
  moreIcon: { color: "#fff", fontSize: 24, fontWeight: "bold" },

  messages: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
    maxWidth: "75%",
  },
  messageBubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    borderBottomLeftRadius: 4,
  },
  messageBubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#15803d",
    borderBottomRightRadius: 4,
  },

  messageText: { color: "#111827", fontSize: 15, lineHeight: 20 },
  messageTextRight: { color: "#fff", fontSize: 15, lineHeight: 20 },

  timestamp: { fontSize: 11, color: "#9ca3af", marginBottom: 12 },
  timestampLeft: { alignSelf: "flex-start", marginLeft: 4 },
  timestampRight: { alignSelf: "flex-end", marginRight: 4 },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#fff",
    padding: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  plusButton: { padding: 8, marginRight: 4 },
  plusIcon: { fontSize: 20, color: "#15803d" },

  textInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: "#000",
    maxHeight: 100,
  },

  sendButton: {
    marginLeft: 8,
    backgroundColor: "#15803d",
    borderRadius: 20,
    padding: 10,
  },
  sendButtonDisabled: { backgroundColor: "#9ca3af" },
  sendText: { fontSize: 18 },
});
