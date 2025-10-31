import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";

export default function Chat() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Chat</Text>
      </View>

      <ScrollView style={styles.messages}>
        <View style={styles.messageBubbleLeft}>
          <Text style={styles.messageText}>Hey! I wanted to know if the textbook was 6th edition?</Text>
        </View>
        <View style={styles.messageBubbleRight}>
          <Text style={styles.messageTextRight}>It is!</Text>
        </View>
        <View style={styles.messageBubbleLeft}>
          <Text style={styles.messageText}>Perfect! I need the book for cs 262 😄</Text>
        </View>
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#9ca3af"
          style={styles.textInput}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>📨</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#15803d",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    color: "#fff",
    fontSize: 20,
    marginRight: 12,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  messages: {
    flex: 1,
    padding: 16,
  },
  messageBubbleLeft: {
    alignSelf: "flex-start",
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "75%",
  },
  messageBubbleRight: {
    alignSelf: "flex-end",
    backgroundColor: "#15803d",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: "75%",
  },
  messageText: {
    color: "#111827",
  },
  messageTextRight: {
    color: "#fff",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: "#000",
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#15803d",
    borderRadius: 20,
    padding: 10,
  },
  sendText: {
    fontSize: 18,
  },
});
