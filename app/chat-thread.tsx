import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
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

  // Convert avatar param back to a proper require() number
  const avatarNumber = avatar ? Number(Array.isArray(avatar) ? avatar[0] : avatar) : null;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! Is the KHvR lobby work to meet later?",
      isUser: false,
      timestamp: "2 weeks ago • 3:24 PM",
    },
    {
      id: 2,
      text: "Yes that's perfect! I'll see you at 7.",
      isUser: true,
      timestamp: "2 weeks ago • 3:30 PM",
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

  {/* Avatar + Name */}
  <View style={styles.headerUserBlock}>
    {avatarNumber && (
      <Image source={avatarNumber} style={styles.headerAvatar} />
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
      >
        <ScrollView
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id}>
              <View
                style={[
                  styles.messageBubble,
                  msg.isUser ? styles.userBubble : styles.listerBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.isUser && styles.messageTextUser,
                  ]}
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

        {/* INPUT BAR */}
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message..."
            placeholderTextColor="#b5b5b5"
            style={styles.textInput}
            multiline
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fefefe" },

  // HEADER
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  // MESSAGES
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
    backgroundColor: "#f97316", // ORANGE BUBBLE
    borderBottomRightRadius: 6,
  },

  listerBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb", // Light gray
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

  // INPUT BAR
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
