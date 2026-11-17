import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import type { Item } from "../../services/supabase_api";
import { itemImageSource, useItemBookmark } from "./ItemCard";

type Props = {
  item: Item;
  communityName?: string;
  // Adds an Available / Borrowed tag under the name.
  showStatus?: boolean;
};

// A compact, list-style version of ItemCard.
export default function ItemRow({ item, communityName, showStatus }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { saved, toggleBookmark } = useItemBookmark(item);

  const isOwner = item.owner_id === user?.id;
  const src = itemImageSource(item.image_path);
  const status =
    item.status === "borrowed" ? "Borrowed" : item.status === "available" ? "Available" : null;

  return (
    <View style={styles.row}>
      <Pressable
        style={styles.main}
        onPress={() => router.push(`/item/${item.id}`)}
        accessibilityRole="button"
      >
        <View style={styles.thumb}>
          {src ? (
            <Image source={src} style={styles.thumbImage} resizeMode="cover" />
          ) : (
            <Ionicons name="cube-outline" size={24} color="#c9a27e" />
          )}
        </View>

        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {!!communityName && (
            <Text style={styles.community} numberOfLines={1}>
              {communityName}
            </Text>
          )}
          {showStatus && status && (
            <View style={[styles.tag, status === "Borrowed" && styles.tagBorrowed]}>
              <Text
                style={[styles.tagText, status === "Borrowed" && styles.tagTextBorrowed]}
              >
                {status}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {isOwner ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({ pathname: "/edit-item", params: { id: item.id } })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.name}`}
        >
          <Ionicons name="pencil" size={14} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={toggleBookmark}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={
            saved ? `Remove bookmark for ${item.name}` : `Bookmark ${item.name}`
          }
          accessibilityState={{ selected: saved }}
        >
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={22} color="#3b1b0d" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  main: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FBEBD9",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  community: {
    fontSize: 13,
    color: "#6b7280",
  },
  tag: {
    alignSelf: "flex-start",
    marginTop: 2,
    backgroundColor: "#FBEBD9",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  tagBorrowed: {
    backgroundColor: "#fee2e2",
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3b1b0d",
  },
  tagTextBorrowed: {
    color: "#b91c1c",
  },
  editButton: {
    backgroundColor: "#f97316",
    padding: 7,
    borderRadius: 20,
  },
});
