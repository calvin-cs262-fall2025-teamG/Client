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
import { Ionicons } from "@expo/vector-icons";
import { messages as messagesApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import type { ImageSourcePropType } from "react-native";

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

function resolveImageSource(key?: string | null): ImageSourcePropType | undefined {
  if (!key) return undefined;

  //  NEW ITEMS
  8: {
    name: "Desk Lamp",
    status: "none",
    image: require("../../assets/images/desklamp.jpeg"),
    count: 120,
    lister: { name: "Sarah T.", avatar: require("../../assets/images/chloe.png"), rating: 4.8 },
  },
  9: {
    name: "Bluetooth Speaker",
    status: "none",
    image: require("../../assets/images/speaker.jpg"),
    count: 95,
    lister: { name: "Evan S.", avatar: require("../../assets/images/jacob.png"), rating: 4.7 },
  },
  10: {
    name: "Mountain Bike",
    status: "none",
    image: require("../../assets/images/bike.jpg"),
    count: 110,
    lister: { name: "Matt D.", avatar: require("../../assets/images/greg.png"), rating: 4.6 },
  },
  11: {
    name: "Cookware Set",
    status: "borrowed",
    image: require("../../assets/images/cookset.jpg"),
    count: 85,
    lister: { name: "Kelly P.", avatar: require("../../assets/images/rose.png"), rating: 4.9 },
  },
  12: {
    name: "Yoga Mat",
    status: "none",
    image: require("../../assets/images/yogamat.jpg"),
    count: 70,
    lister: { name: "Mia L.", avatar: require("../../assets/images/laila.png"), rating: 4.8 },
  },
  13: {
    name: "Wireless Headphones",
    status: "none",
    image: require("../../assets/images/wirelessbuds.jpg"),
    count: 130,
    lister: { name: "Tori W.", avatar: require("../../assets/images/bryn.png"), rating: 4.7 },
  },
  14: {
    name: "Standing Desk",
    status: "none",
    image: require("../../assets/images/standingdesk.jpg"),
    count: 90,
    lister: { name: "Ben J.", avatar: require("../../assets/images/chloe.png"), rating: 4.5 },
  },
  15: {
    name: "Electric Kettle",
    status: "none",
    image: require("../../assets/images/electrickettle.jpg"),
    count: 85,
    lister: { name: "Nora Q.", avatar: require("../../assets/images/helen.png"), rating: 4.8 },
  },
  16: {
    name: "Camping Tent",
    status: "none",
    image: require("../../assets/images/campingtent.jpg"),
    count: 120,
    lister: { name: "Derek P.", avatar: require("../../assets/images/jacob.png"), rating: 4.7 },
  },
  17: {
    name: "Electric Drill",
    status: "borrowed",
    image: require("../../assets/images/drill.jpg"),
    count: 140,
    lister: { name: "Sam G.", avatar: require("../../assets/images/greg.png"), rating: 4.8 },
  },
  18: {
    name: "Cookbook",
    status: "none",
    image: require("../../assets/images/cookbook.jpg"),
    count: 110,
    lister: { name: "Emily R.", avatar: require("../../assets/images/rose.png"), rating: 4.9 },
  },
  19: {
    name: "Smartwatch",
    status: "none",
    image: require("../../assets/images/smartwatch.jpg"),
    count: 150,
    lister: { name: "Owen T.", avatar: require("../../assets/images/laila.png"), rating: 4.8 },
  },
  20: {
    name: "Pressure Washer",
    status: "none",
    image: require("../../assets/images/pressurewasher.jpg"),
    count: 100,
    lister: { name: "Caleb Z.", avatar: require("../../assets/images/jacob.png"), rating: 4.7 },
  },
  21: {
    name: "Laptop Stand",
    status: "none",
    image: require("../../assets/images/laptopstand.jpg"),
    count: 120,
    lister: { name: "Hannah K.", avatar: require("../../assets/images/chloe.png"), rating: 4.8 },
  },
  22: {
    name: "Garden Hose",
    status: "none",
    image: require("../../assets/images/hose.jpg"),
    count: 110,
    lister: { name: "Adam S.", avatar: require("../../assets/images/greg.png"), rating: 4.6 },
  },
  23: {
    name: "Vacuum",
    status: "none",
    image: require("../../assets/images/vacuum2.jpg"),
    count: 156,
    lister: {
      name: "Julia R.",
      avatar: require("../../assets/images/laila.png"),
      rating: 4.7,
    },
  },
  24: {
    name: "Vacuum",
    status: "none",
    image: require("../../assets/images/vacuum3.jpg"),
    count: 156,
    lister: {
      name: "Marcus T.",
      avatar: require("../../assets/images/jacob.png"),
      rating: 4.6,
    },
  },
  25: {
    name: "Vacuum",
    status: "borrowed",
    image: require("../../assets/images/vacuum4.jpg"),
    count: 156,
    lister: {
      name: "Ava J.",
      avatar: require("../../assets/images/chloe.png"),
      rating: 4.9,
    },
  },
  26: {
    name: "Vacuum",
    status: "borrowed",
    image: require("../../assets/images/vacuum5.jpg"),
    count: 156,
    lister: {
      name: "James L.",
      avatar: require("../../assets/images/greg.png"),
      rating: 4.8,
    },
  },
  27: {
    name: "Vacuum",
    status: "none",
    image: require("../../assets/images/vacuum6.jpg"),
    count: 156,
    lister: {
      name: "Ella M.",
      avatar: require("../../assets/images/helen.png"),
      rating: 4.8,
    },
  },
};

  // local bundled image by filename
  const lower = trimmed.toLowerCase();
  return imageMap[lower];
}

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
}

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const numericId = Array.isArray(id) ? Number(id[0]) : Number(id);

  const item = presetItems[numericId];
  const [isNotified, setIsNotified] = useState(false);

  // derive status safely even if item is undefined
  const status: "borrowed" | "none" = item?.status ?? "none";


  // Load item from API
  useEffect(() => {
    const loadItem = async () => {
      if (Number.isNaN(numericId)) {
        setLoading(false);
        return;
      }
    };

    if (!Number.isNaN(numericId)) {
      checkInitialNotify();
    }
  }, [numericId]);

  // show "Good news!" if item is now available
  useEffect(() => {
    const checkNotify = async () => {
      if (!item) return;

      try {
        const data: any = await itemsApi.getById(numericId);

        console.log("ITEM DETAILS RAW:", JSON.stringify(data, null, 2));

        console.log("owner_avatar raw:", data.owner_avatar);
        console.log("owner_avatar normalized:", (data.owner_avatar ?? "").trim().toLowerCase());

        console.log("profile_picture raw:", data.profile_picture);
        console.log("profile_picture normalized:", (data.profile_picture ?? "").trim().toLowerCase());

    if (!Number.isNaN(numericId)) {
      checkNotify();
    }
  }, [numericId, status, item]);

  // ❗ early return is now AFTER hooks, so hooks run on every render
  if (!item || Number.isNaN(numericId)) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>Item not found.</Text>
      </View>
    );
  }

  const handleNotifyMe = async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFY_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];

      if (!ids.includes(numericId)) {
        ids.push(numericId);
        await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(ids));
        setIsNotified(true);

        Alert.alert(
          "Notification set",
          `We'll notify you when ${item.name} becomes available.`
        );
      } else {
        const updated = ids.filter((x) => x !== numericId);
        await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(updated));
        setIsNotified(false);

        Alert.alert(
          "Notification removed",
          `You will no longer be notified about ${item.name}.`
        );
      }
    } catch (err) {
      console.log("Error saving notify-me:", err);
    }
  };

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
  const itemImageSource = resolveImageSource(item.image_url);

  // try multiple possible fields for avatar coming from API
  const avatarKey =
    item.owner_avatar ??
    (item as any).profile_picture ??
    (item as any).owner_profile_picture ??
    null;

  const ownerAvatarSource = resolveImageSource(avatarKey);

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

      {/* ACTION BUTTONS */}
      {status === "none" ? (
        <TouchableOpacity
          style={styles.borrowButton}
          onPress={() =>
            router.push({
              pathname: "/borrow-confirmation",
              params: {
                itemName: item.name,
                listerName: item.lister.name,
                image: item.image,
              },
            })
          }
        >
          <Text style={styles.borrowText}>Borrow Now</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.notifyButton,
            isNotified && styles.notifyButtonDisabled,
          ]}
          onPress={handleNotifyMe}
        >
          <Text style={styles.notifyText}>
            {isNotified ? "Notifying you" : "Notify Me"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
  notifyText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  notifyButtonDisabled: {
    opacity: 0.6,
  },
});