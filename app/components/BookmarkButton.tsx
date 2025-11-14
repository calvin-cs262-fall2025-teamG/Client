import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookmarksUnsafe } from "../../context/BookmarksContext";

type Props = {
  item: { id: string; title: string };
  size?: number;
  color?: string;
};

export default function BookmarkButton({ item, size = 20, color = "#3b1b0d" }: Props) {
  const ctx = useBookmarksUnsafe();

  if (!ctx) {
    return <Ionicons name="bookmark-outline" size={size} color={color} />;
  }

  const { isSaved, toggle } = ctx;
  const saved = isSaved(item.id);

  return (
    <Pressable onPress={() => toggle(item)} hitSlop={8}>
      <Ionicons 
        name={saved ? "bookmark" : "bookmark-outline"} 
        size={size} 
        color={color}
      />
    </Pressable>
  );
}