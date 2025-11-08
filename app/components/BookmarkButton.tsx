import React from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookmarksUnsafe } from "../../context/BookmarksContext";

type Props = {
  item: { id: string; title: string };
  size?: number;
};

export default function BookmarkButton({ item, size = 20 }: Props) {
  const ctx = useBookmarksUnsafe();

  if (!ctx) {
    return <Ionicons name="heart-outline" size={size} />;
  }

  const { isSaved, toggle } = ctx;
  const saved = isSaved(item.id);

  return (
    <Pressable onPress={() => toggle(item)} hitSlop={8}>
      <Ionicons name={saved ? "heart" : "heart-outline"} size={size} />
    </Pressable>
  );
}
