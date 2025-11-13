import React from "react";
import { Pressable, Image } from "react-native";
import { useBookmarksUnsafe } from "../context/BookmarksContext";

const bookmarkIcon = require("../../assets/images/bookmark.png"); // fixed path

type Props = {
  item: { id: string; title: string };
  size?: number;
};

export default function BookmarkButton({ item, size = 20 }: Props) {
  const ctx = useBookmarksUnsafe();

  if (!ctx) {
    return (
      <Image
        source={bookmarkIcon}
        style={{ width: size, height: size, opacity: 0.5 }}
        resizeMode="contain"
      />
    );
  }

  const { isSaved, toggle } = ctx;
  const saved = isSaved(item.id);

  return (
    <Pressable onPress={() => toggle(item)} hitSlop={8}>
      <Image
        source={bookmarkIcon}
        style={{
          width: size,
          height: size,
          opacity: saved ? 1 : 0.35,
        }}
        resizeMode="contain"
      />
    </Pressable>
  );
}
