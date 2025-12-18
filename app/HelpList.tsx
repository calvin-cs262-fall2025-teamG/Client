import React from "react";
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

interface HelpSection {
  key: string;
  title: string;
}

export default function HelpListScreen() {
  const helpSections: HelpSection[] = [
    { key: "listing", title: "Listing an item" },
    { key: "signup", title: "Signing up and logging in" },
    { key: "messaging", title: "Messaging a neighbor" },
    { key: "searching", title: "Searching for posts" },
    { key: "account", title: "Managing your account" },
    { key: "editing", title: "Editing or deleting a post" },
    { key: "logout", title: "Logging out" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & FAQ</Text>
        <View style={styles.spacer} />
      </View>

      <FlatList
        data={helpSections}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sectionItem}
            onPress={() =>
              router.push({
                pathname: "/HelpDetails",
                params: { sectionKey: item.key },
              })
            }
          >
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  closeButton: { padding: 8 },
  closeText: { fontSize: 24, fontWeight: "bold", color: "#f97316" },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  spacer: { width: 24 },
  listContent: { padding: 20 },
  sectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  sectionTitle: { fontSize: 16, fontWeight: "500", color: "#333", flex: 1 },
  chevron: { fontSize: 20, color: "#f97316", fontWeight: "bold" },
});