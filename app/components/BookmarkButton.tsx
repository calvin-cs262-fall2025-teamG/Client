import React, { useState, useEffect } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBookmarks } from "../../context/BookmarksContext";
import { useAuth } from "../../context/AuthContext";

type Props = {
  item: { id: string; title: string };
  size?: number;
  color?: string;
  showCount?: boolean;
};

export default function BookmarkButton({
  item,
  size = 20,
  color = "#3b1b0d",
  showCount = true,
}: Props) {
  const ctx = useBookmarks();
  const { user } = useAuth();

  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarkCount();
  }, [item.id]);

  const loadBookmarkCount = async () => {
    const itemId = Number(item.id);
    const key = `bookmark-count:${itemId}`;

    try {
      const stored = await AsyncStorage.getItem(key);
      const count = stored ? parseInt(stored) : 0;
      console.log(`📊 Loaded count for item ${itemId}: ${count}`);
      setBookmarkCount(count);
    } catch (err) {
      console.error("Error loading bookmark count:", err);
      setBookmarkCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!ctx || !user) return;

    const itemId = Number(item.id);
    const key = `bookmark-count:${itemId}`;

    const wasBookmarked = ctx.isSaved(itemId);
    
    ctx.toggle(item);

    const newCount = wasBookmarked
      ? Math.max(0, bookmarkCount - 1)
      : bookmarkCount + 1;

    try {
      await AsyncStorage.setItem(key, String(newCount));
      console.log(`✅ Updated count for item ${itemId}: ${newCount}`);
      setBookmarkCount(newCount);
    } catch (error) {
      console.error("Error updating bookmark count:", error);
    }
  };

  if (!ctx) {
    return (
      <View style={styles.container}>
        {showCount && !loading && bookmarkCount > 0 && (
          <Text style={[styles.count, { color }]}>{bookmarkCount}</Text>
        )}
        <Ionicons name="bookmark-outline" size={size} color={color} />
      </View>
    );
  }

  const itemId = Number(item.id);
  const saved = ctx.isSaved(itemId);

  return (
    <Pressable onPress={handleToggle} hitSlop={8}>
      <View style={styles.container}>
        {showCount && !loading && bookmarkCount > 0 && (
          <Text style={[styles.count, { color }]}>{bookmarkCount}</Text>
        )}
        <Ionicons
          name={saved ? "bookmark" : "bookmark-outline"}
          size={size}
          color={color}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  count: {
    fontSize: 14,
    fontWeight: "600",
  },
});