import { Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBookmarks, BookmarkItem } from "../context/BookmarksContext";

export default function BookmarkButton({ item, size = 20 }: { item: BookmarkItem; size?: number }) {
  const { isSaved, toggle } = useBookmarks();
  const saved = isSaved(item.id);

  return (
    <Pressable onPress={() => toggle(item)} hitSlop={10} accessibilityLabel={saved ? "Remove bookmark" : "Add bookmark"}>
      <View style={[styles.wrap, saved && styles.wrapSaved]}>
        <Ionicons name={saved ? "heart" : "heart-outline"} size={size} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 6, borderRadius: 9999, backgroundColor: "rgba(255,255,255,0.9)" },
  wrapSaved: { backgroundColor: "rgba(255,220,220,0.95)" },
});
