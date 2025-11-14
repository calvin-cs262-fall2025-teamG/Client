import React from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useBookmarks } from "../context/BookmarksContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BookmarkScreen() {
  const { ids, byId, remove } = useBookmarks();
  const router = useRouter();

  // Convert byId → array of bookmark items
  const bookmarkedItems = Object.values(byId);

  return (
    <View style={styles.container}>
      {bookmarkedItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>Add items to your bookmarks to see them here.</Text>
        </View>
      ) : (
        <FlatList
          data={bookmarkedItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/item/${item.id}`)}
              activeOpacity={0.8}
            >
              {item.image ? (
                <Image source={item.image} style={styles.itemImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image" size={30} color="#9ca3af" />
                </View>
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{item.title}</Text>

                <TouchableOpacity
                  onPress={() => remove(item.id)}
                  style={styles.removeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 12,
  },

  emptySub: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 6,
    textAlign: "center",
  },

  itemCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  itemImage: {
    width: "100%",
    height: 180,
  },

  imagePlaceholder: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },

  itemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },

  itemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    flexShrink: 1,
  },

  removeButton: {
    padding: 4,
  },
});
