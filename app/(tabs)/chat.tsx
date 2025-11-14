import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const jacobImage = require("../../assets/images/jacob.png");
const helenImage = require("../../assets/images/helen.png");
const lailaImage = require("../../assets/images/laila.png");
const chloeImage = require("../../assets/images/chloe.png");
const gregImage = require("../../assets/images/greg.png");
const brynImage = require("../../assets/images/bryn.png");

interface ChatPreview {
  id: number;
  name: string;
  avatar: any;
  lastMessage: string;
  time: string;
  unread?: number;
}

export default function Chat() {
  const router = useRouter();

  const chats: ChatPreview[] = [
    {
      id: 1,
      name: "Bryn Lamppa",
      avatar: brynImage,
      lastMessage: "Perfect! I need the book for CS 262 😄",
      time: "2m",
      unread: 2,
    },
    {
      id: 2,
      name: "Helen Lee",
      avatar: helenImage,
      lastMessage: "Is the tractor still available?",
      time: "1h",
      unread: 1,
    },
    {
      id: 3,
      name: "Laila Smith",
      avatar: lailaImage,
      lastMessage: "Thanks for the quick response!",
      time: "3h",
    },
    {
      id: 4,
      name: "Chloe Kottwitz",
      avatar: chloeImage,
      lastMessage: "Can we meet tomorrow at 3pm?",
      time: "5h",
    },
    {
      id: 5,
      name: "Gregory Goodfellow",
      avatar: gregImage,
      lastMessage: "The couch looks great!",
      time: "1d",
    },
    {
      id: 6,
      name: "Jacob Lanning",
      avatar: jacobImage,
      lastMessage: "When can I borrow it?",
      time: "2d",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Removed orange header */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={16}
          color="#6b7280"
          style={styles.searchIcon}
        />
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
              <Image source={chat.avatar} style={styles.avatarImage} />
            </View>

            <View style={styles.chatContent}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{chat.name}</Text>
                <Text style={styles.chatTime}>{chat.time}</Text>
              </View>

              <View style={styles.messageRow}>
                <Text style={styles.lastMessage} numberOfLines={1}>
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
    </SafeAreaView>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    resizeMode: "cover",
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
