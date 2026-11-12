import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import type { ImageSourcePropType } from "react-native";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import {
  items as itemsApi,
  type Item,
  type Profile,
} from "../../services/supabase_api";

const imageMap: Record<string, any> = {
  // item images
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

  // avatar images
  "greg.png": require("../../assets/images/greg.png"),
  "jacob.png": require("../../assets/images/jacob.png"),
  "helen.png": require("../../assets/images/helen.png"),
  "rose.png": require("../../assets/images/rose.png"),
  "bryn.png": require("../../assets/images/bryn.png"),
  "laila.png": require("../../assets/images/laila.png"),
};

function resolveImageSource(
  key?: string | null,
): ImageSourcePropType | undefined {
  if (!key) return undefined;

  const trimmed = key.trim();
  if (!trimmed) return undefined;

  // remote URL
  if (/^https?:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }

  // local bundled image by filename
  const lower = trimmed.toLowerCase();
  return imageMap[lower];
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const itemId = Array.isArray(id) ? id[0] : id;

  const [item, setItem] = useState<Item | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const { getProfile, myRequests, requestToBorrow } = useDatabase();
  const [sending, setSending] = useState(false);

  const ownerName = owner?.display_name || "Neighbor";

  const sendBorrowRequestMessage = async () => {
    if (!user) {
      Alert.alert("Not logged in", "Please log in to request an item.");
      return;
    }
    if (!item) return;

    setSending(true);
    try {
      await requestToBorrow(item.id);
    } catch (e) {
      console.error("Failed to send borrow request:", e);
      Alert.alert(
        "Message failed",
        "Could not send your request. Please try again.",
      );
      return;
    } finally {
      setSending(false);
    }

    // The user reviews and sends the prefilled message themselves
    router.push({
      pathname: "/chat-thread",
      params: {
        id: item.owner_id,
        name: ownerName,
        draft: `Hi! I'd love to borrow your ${item.name}.`,
        itemId: item.id,
      },
    });
  };

  // Load item and its owner from Supabase
  useEffect(() => {
    const loadItem = async () => {
      if (!itemId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await itemsApi.getById(itemId);
        if (error) throw error;
        // A missing item can come back as a row of nulls, so check the id too.
        if (!data?.id) return;

        setItem(data);
        setOwner(await getProfile(data.owner_id));
      } catch (error) {
        console.error("Failed to load item:", error);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [itemId, getProfile]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Item not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isBorrowed = item.status === "borrowed";
  const isOwnItem = item.owner_id === user?.id;
  const hasPendingRequest = myRequests.some(
    (r) => r.item_id === item.id && r.status === "pending",
  );
  const itemImageSource = resolveImageSource(item.image_path);
  const ownerAvatarSource = resolveImageSource(owner?.avatar_path);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Back button header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* ITEM IMAGE */}
        {itemImageSource ? (
          <Image
            source={itemImageSource}
            style={[styles.image, isBorrowed && { opacity: 0.55 }]}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        {/* NAME */}
        <Text style={styles.name}>{item.name}</Text>

        {/* DESCRIPTION */}
        {item.description && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {/* BADGE */}
        {isBorrowed && (
          <View style={[styles.badge, styles.borrowed]}>
            <Text style={styles.badgeText}>BORROWED</Text>
          </View>
        )}

        {/* LISTER PROFILE */}
        <View style={styles.listerCard}>
          {ownerAvatarSource ? (
            <Image source={ownerAvatarSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {ownerName.charAt(0)}
              </Text>
            </View>
          )}

          <View style={styles.listerInfo}>
            <Text style={styles.listerName}>{ownerName}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() =>
              router.push({
                pathname: "/chat-thread",
                params: {
                  id: item.owner_id,
                  name: ownerName,
                },
              })
            }
          >
            <Text style={styles.viewProfileText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* ACTION BUTTONS */}
        {isBorrowed ? (
          <View style={styles.borrowedContainer}>
            <Text style={styles.borrowedText}>
              This item is currently borrowed
            </Text>
          </View>
        ) : isOwnItem ? null : (
          <TouchableOpacity
            style={[
              styles.borrowButton,
              (sending || hasPendingRequest) && { opacity: 0.6 },
            ]}
            disabled={sending || hasPendingRequest}
            onPress={() =>
              Alert.alert(
                "Borrow Request",
                `Send a borrow request for ${item.name}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: sending ? "Sending..." : "Send Request",
                    onPress: sendBorrowRequestMessage,
                  },
                ],
              )
            }
          >
            <Text style={styles.borrowText}>
              {sending
                ? "Sending..."
                : hasPendingRequest
                  ? "Request sent"
                  : "Request to Borrow"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "600",
  },
  image: {
    width: "100%",
    height: 330,
    resizeMode: "cover",
    backgroundColor: "#f3f4f6",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  placeholderText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    paddingHorizontal: 16,
    paddingTop: 8,
    lineHeight: 24,
  },
  badge: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  borrowed: {
    backgroundColor: "#ef4444",
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  listerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    margin: 16,
    borderRadius: 14,
    gap: 14,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: "#f97316",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  listerInfo: {
    flex: 1,
  },
  listerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  viewProfileButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewProfileText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  borrowButton: {
    backgroundColor: "#438732ff",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  borrowedContainer: {
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#fee2e2",
  },
  borrowedText: {
    color: "#991b1b",
    fontWeight: "600",
    fontSize: 16,
  },
});
