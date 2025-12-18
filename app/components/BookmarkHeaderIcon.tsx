import React from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBookmarks } from "../../context/BookmarksContext";

export default function BookmarkHeaderIcon() {
  const router = useRouter();
  const { byId } = useBookmarks();
  const count = Object.keys(byId).length;

  return (
    <Pressable
      onPress={() => router.push("/bookmark")}
      hitSlop={10}
      accessibilityLabel="Open bookmarks"
    >
      <View>
        <Ionicons name="bookmark" size={24} color="#3b1b0d" />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#f97316",
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});