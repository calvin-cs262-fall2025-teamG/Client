import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { items as itemsApi } from "../../services/api";

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


interface ItemDetails {
  item_id: number;
  name: string;
  description?: string;
  image_url?: string;
  category?: string;
  owner_id: number;
  request_status: string;
  start_date?: string;
  end_date?: string;
  owner_name?: string;
  owner_avatar?: string;
  owner_rating?: number;
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const numericId = Array.isArray(id) ? Number(id[0]) : Number(id);

  const [item, setItem] = useState<ItemDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Load item from API
  useEffect(() => {
    const loadItem = async () => {
      if (Number.isNaN(numericId)) {
        setLoading(false);
        return;
      }

      try {
        const data: any = await itemsApi.getById(numericId);

        console.log("ITEM DETAILS RAW:", JSON.stringify(data, null, 2));

        console.log("owner_avatar raw:", data.owner_avatar);
        console.log("owner_avatar normalized:", (data.owner_avatar ?? "").trim().toLowerCase());

        console.log("profile_picture raw:", data.profile_picture);
        console.log("profile_picture normalized:", (data.profile_picture ?? "").trim().toLowerCase());

        setItem(data);
      } catch (error) {
        console.error("Failed to load item:", error);
      } finally {
        setLoading(false);
      }

    };

    loadItem();
  }, [numericId]);

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

  if (!item || Number.isNaN(numericId)) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Item not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isBorrowed = item.request_status !== "available";
  const localImage = item.image_url ? imageMap[item.image_url] : undefined;
  const ownerKey = (item.owner_avatar ?? "").trim().toLowerCase();
  const localOwnerAvatar = ownerKey ? imageMap[ownerKey] : undefined;


  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container}>
        {/* ITEM IMAGE */}
        {localImage ? (
          <Image
            source={localImage}
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
          {localOwnerAvatar ? (
            <Image source={localOwnerAvatar} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.owner_name?.charAt(0) || "?"}
              </Text>
            </View>
          )}

          <View style={styles.listerInfo}>
            <Text style={styles.listerName}>
              {item.owner_name || `User ${item.owner_id}`}
            </Text>
            {item.owner_rating && (
              <Text style={styles.rating}>⭐ {item.owner_rating}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewProfileButton}
            onPress={() =>
              router.push({
                pathname: "/chat-thread",
                params: {
                  id: item.owner_id,
                  name: item.owner_name || `User ${item.owner_id}`,
                },
              })
            }
          >
            <Text style={styles.viewProfileText}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* ACTION BUTTONS */}
        {!isBorrowed ? (
          <TouchableOpacity
            style={styles.borrowButton}
            onPress={() =>
              Alert.alert(
                "Borrow Request",
                `Send a borrow request for ${item.name}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Send Request",
                    onPress: () => {
                      // Navigate to chat with the owner
                      router.push({
                        pathname: "/chat-thread",
                        params: {
                          id: item.owner_id,
                          name: item.owner_name || `User ${item.owner_id}`,
                        },
                      });
                    },
                  },
                ]
              )
            }
          >
            <Text style={styles.borrowText}>Request to Borrow</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.borrowedContainer}>
            <Text style={styles.borrowedText}>
              This item is currently borrowed
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView >
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
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
  rating: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
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