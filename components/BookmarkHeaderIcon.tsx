import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useBookmarks } from "../context/BookmarksContext";

export default function BookmarkHeaderIcon() {
  const router = useRouter();
  const { ids } = useBookmarks();
  const count = ids.size;

  return (
    <Pressable onPress={() => router.push("/bookmark")} hitSlop={10} accessibilityLabel="Open bookmarks">
      <View>
        <Ionicons name="bookmark" size={24} />
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count}</Text>
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
    backgroundColor: "#ff5a5f",
    borderRadius: 10,
    paddingHorizontal: 5,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
