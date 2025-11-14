import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBookmarks } from "../context/BookmarksContext";

export default function BookmarkScreen() {
  const { byId, isSaved, toggle, remove } = useBookmarks();
  const router = useRouter();

  const items = Object.values(byId);

  return (
    <ScrollView style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={60} color="#9ca3af" />
          <Text style={styles.emptyText}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>
            Tap the bookmark icon on an item to save it.
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((item) => {
            const saved = isSaved(item.id);

            return (
              <View key={item.id} style={styles.card}>
                {/* Floating DELETE Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => remove(item.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="trash-outline" size={22} color="#ef4444" />
                </TouchableOpacity>

                {/* Floating Bookmark Toggle */}
                <TouchableOpacity
                  style={styles.bookmarkIconContainer}
                  onPress={() => toggle(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={saved ? "bookmark" : "bookmark-outline"}
                    size={22}
                    color="#3b1b0d"
                  />
                </TouchableOpacity>

                {/* ITEM IMAGE */}
                <TouchableOpacity
                  onPress={() => router.push(`/item/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={item.image}
                    style={[
                      styles.image,
                      item.status === "borrowed" && { opacity: 0.55 },
                    ]}
                  />
                </TouchableOpacity>

                {/* Borrowed badge */}
                {item.status === "borrowed" && (
                  <View style={[styles.badge, styles.borrowedBadge]}>
                    <Text style={styles.badgeText}>Borrowed</Text>
                  </View>
                )}

                {/* Name + Count */}
                <TouchableOpacity
                  onPress={() => router.push(`/item/${item.id}`)}
                  activeOpacity={0.8}
                  style={styles.info}
                >
                  <Text
                    style={[
                      styles.name,
                      item.status === "borrowed" && { opacity: 0.7 },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>

                  {item.count !== undefined && (
                    <Text
                      style={[
                        styles.count,
                        item.status === "borrowed" && { opacity: 0.7 },
                      ]}
                    >
                      {item.count}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
  },

  emptyText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#4b5563",
  },

  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#9ca3af",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },

  card: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },

  image: {
    width: "100%",
    height: 160,
    backgroundColor: "#f3f4f6",
  },

  info: {
    padding: 12,
  },

  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  count: {
    fontSize: 13,
    color: "#6b7280",
  },

  /* floating delete button */
  deleteButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 6,
    borderRadius: 20,
  },

  /* floating bookmark button */
  bookmarkIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 6,
    borderRadius: 20,
  },

  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 10,
  },

  borrowedBadge: {
    backgroundColor: "#f73e3eaf",
  },

  badgeText: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
});
