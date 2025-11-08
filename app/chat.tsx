import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import PageContainer from "./components/PageContainer";

interface ChatPreview {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread?: number;
}

export default function Chat() {
  const router = useRouter();

  const chats: ChatPreview[] = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "👩",
      lastMessage: "Perfect! I need the book for CS 262 😄",
      time: "2m",
      unread: 2,
    },
    {
      id: 2,
      name: "Mike Chen",
      avatar: "👨",
      lastMessage: "Is the tractor still available?",
      time: "1h",
      unread: 1,
    },
    {
      id: 3,
      name: "Emma Davis",
      avatar: "👩‍🦰",
      lastMessage: "Thanks for the quick response!",
      time: "3h",
    },
    {
      id: 4,
      name: "James Wilson",
      avatar: "👨‍🦱",
      lastMessage: "Can we meet tomorrow at 3pm?",
      time: "5h",
    },
    {
      id: 5,
      name: "Lisa Brown",
      avatar: "👩‍🦳",
      lastMessage: "The couch looks great!",
      time: "1d",
    },
    {
      id: 6,
      name: "Tom Anderson",
      avatar: "👨‍🦲",
      lastMessage: "When can I borrow it?",
      time: "2d",
    },
  ];

  return (
    <PageContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <TouchableOpacity style={styles.composeButton}>
          <Text style={styles.composeIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Chat List */}
      <ScrollView style={styles.chatList}>
        {chats.map((chat) => (
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
            <View style={styles.avatarContainer}>
              <Text style={styles.avatar}>{chat.avatar}</Text>
            </View>

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>

              <View style={styles.messageRow}>
                <Text
                  style={[
                    styles.lastMessage,
                    chat.unread && styles.unreadMessage,
                  ]}
                  numberOfLines={1}
                >
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
      </ScrollView>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f97316",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  composeButton: {
    padding: 4,
  },
  composeIcon: {
    fontSize: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
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
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatar: {
    fontSize: 32,
  },
  chatContent: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
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
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },
  unreadMessage: {
    color: "#111827",
    fontWeight: "500",
  },
  unreadBadge: {
    backgroundColor: "#f97316",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
