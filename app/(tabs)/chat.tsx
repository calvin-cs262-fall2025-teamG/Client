import React, { useState, useMemo } from "react";
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

export default function Chat() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const chats = [
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
      lastMessage: "How long can I borrow the chair for?",
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

  // 🔍 FILTER CHATS LIVE
  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* CHAT LIST */}
      <ScrollView style={styles.chatList}>
        {filteredChats.map((chat) => (
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
            <Image source={chat.avatar} style={styles.avatarImage} />

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

        {filteredChats.length === 0 && (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ color: "#6b7280" }}>No chats found.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export const options = {
  headerShown: false,
};

// STYLES
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
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 8,
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
    alignItems: "center",
  },

  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
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

  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },

  unreadBadge: {
    marginLeft: 8,
    backgroundColor: "#f97316",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  unreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
