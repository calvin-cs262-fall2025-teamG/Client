import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useBookmarks } from "../../context/BookmarksContext";
import {
  getBookmarkCount,
  updateBookmarkCount,
} from "../../services/bookmarkCount";
import type { Item } from "../../services/supabase_api";

// Local seed-data filenames mapped to bundled images.
const imageMap: Record<string, ImageSourcePropType> = {
  "banner.png": require("../../assets/images/banner.png"),
  "bike.jpg": require("../../assets/images/bike.jpg"),
  "campingtent.jpg": require("../../assets/images/campingtent.jpg"),
  "chair.jpg": require("../../assets/images/chair.jpg"),
  "charger.jpg": require("../../assets/images/charger.jpg"),
  "cookbook.jpg": require("../../assets/images/cookbook.jpg"),
  "cookset.jpg": require("../../assets/images/cookset.jpg"),
  "corebook.jpg": require("../../assets/images/corebook.jpg"),
  "desklamp.jpeg": require("../../assets/images/desklamp.jpeg"),
  "drill.jpg": require("../../assets/images/drill.jpg"),
  "electrickettle.jpg": require("../../assets/images/electrickettle.jpg"),
  "hose.jpg": require("../../assets/images/hose.jpg"),
  "keurig.png": require("../../assets/images/keurig.png"),
  "laptopstand.jpg": require("../../assets/images/laptopstand.jpg"),
  "pressurewasher.jpg": require("../../assets/images/pressurewasher.jpg"),
  "smartwatch.jpg": require("../../assets/images/smartwatch.jpg"),
  "speaker.jpg": require("../../assets/images/speaker.jpg"),
  "standingdesk.jpg": require("../../assets/images/standingdesk.jpg"),
  "tools.jpg": require("../../assets/images/tools.jpg"),
  "tractor.jpg": require("../../assets/images/tractor.jpg"),
  "vacuum.jpg": require("../../assets/images/vacuum.jpg"),
  "vacuum2.jpg": require("../../assets/images/vacuum2.jpg"),
  "vacuum3.jpg": require("../../assets/images/vacuum3.jpg"),
  "vacuum4.jpg": require("../../assets/images/vacuum4.jpg"),
  "vacuum5.jpg": require("../../assets/images/vacuum5.jpg"),
  "vacuum6.jpg": require("../../assets/images/vacuum6.jpg"),
  "wirelessbuds.jpg": require("../../assets/images/wirelessbuds.jpg"),
  "yogamat.jpg": require("../../assets/images/yogamat.jpg"),
};

function imageSource(path: string | null): ImageSourcePropType | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return { uri: path };
  const filename = path.split("/").pop()?.toLowerCase() ?? "";
  return imageMap[filename] ?? null;
}

type Props = {
  item: Item;
  // The label is shown only when the parent asks for it.
  showCommunity?: boolean;
  communityName?: string;
};

export default function ItemCard({ item, showCommunity, communityName }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { isSaved, toggle } = useBookmarks();

  const isOwner = item.owner_id === user?.id;
  const isBorrowed = item.status === "borrowed";
  const saved = isSaved(item.id);
  const src = imageSource(item.image_path);

  const handleBookmark = async () => {
    toggle({
      id: item.id,
      title: item.name,
      image_path: item.image_path ?? null,
      count: 0,
      status: isBorrowed ? "borrowed" : "none",
      category: item.category || "Other",
    });
    const current = await getBookmarkCount(item.id);
    await updateBookmarkCount(item.id, saved, current);
  };

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => router.push(`/item/${item.id}`)}
        accessibilityRole="button"
        style={isBorrowed && styles.dimmed}
      >
        <View style={styles.imageBlock}>
          {src ? (
            <Image source={src} style={styles.image} resizeMode="cover" />
          ) : (
            <Ionicons
              testID="item-card-placeholder"
              name="cube-outline"
              size={40}
              color="#c9a27e"
            />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {showCommunity && !!communityName && (
            <View style={styles.communityLabel}>
              <Text style={styles.communityLabelText} numberOfLines={1}>
                {communityName}
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {isBorrowed && (
        <View style={styles.borrowedBadge}>
          <Text style={styles.borrowedText}>Borrowed</Text>
        </View>
      )}

      {isOwner ? (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() =>
            router.push({ pathname: "/edit-item", params: { id: item.id } })
          }
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.name}`}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil" size={16} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={handleBookmark}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={
            saved ? `Remove bookmark for ${item.name}` : `Bookmark ${item.name}`
          }
          accessibilityState={{ selected: saved }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={20}
            color="#3b1b0d"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dimmed: {
    opacity: 0.6,
  },
  imageBlock: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FBEBD9",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  info: {
    padding: 12,
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  communityLabel: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  communityLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c2410c",
  },
  borrowedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f73e3eaf",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  borrowedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bookmarkButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 6,
    borderRadius: 20,
  },
  editButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f97316",
    padding: 8,
    borderRadius: 20,
  },
});
