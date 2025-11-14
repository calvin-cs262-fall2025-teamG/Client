import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// -------- ITEM + LISTER DATA ----------
type ItemDetails = {
  name: string;
  status: "borrowed" | "none";
  image: any;
  count: number;
  lister: {
    name: string;
    avatar: any;
    rating: number;
  };
};

const presetItems: Record<number, ItemDetails> = {
  1: {
    name: "USB-C Charger",
    status: "none",
    image: require("../../assets/images/charger.jpg"),
    count: 254,
    lister: { name: "Laila M.", avatar: require("../../assets/images/laila.png"), rating: 4.9 },
  },
  2: {
    name: "Core 100 Book",
    status: "borrowed",
    image: require("../../assets/images/corebook.jpg"),
    count: 243,
    lister: { name: "Rose C.", avatar: require("../../assets/images/rose.png"), rating: 4.7 },
  },
  3: {
    name: "Office Chair",
    status: "none",
    image: require("../../assets/images/chair.jpg"),
    count: 180,
    lister: { name: "Chloe K.", avatar: require("../../assets/images/chloe.png"), rating: 5.0 },
  },
  4: {
    name: "Keurig",
    status: "none",
    image: require("../../assets/images/keurig.png"),
    count: 180,
    lister: { name: "Bryn L.", avatar: require("../../assets/images/bryn.png"), rating: 4.8 },
  },
  5: {
    name: "Tool Set",
    status: "none",
    image: require("../../assets/images/tools.jpg"),
    count: 156,
    lister: { name: "Jacob W.", avatar: require("../../assets/images/jacob.png"), rating: 4.6 },
  },
  6: {
    name: "Garden Tractor",
    status: "none",
    image: require("../../assets/images/tractor.jpg"),
    count: 180,
    lister: { name: "Helen P.", avatar: require("../../assets/images/helen.png"), rating: 4.9 },
  },
  7: {
    name: "Vacuum",
    status: "borrowed",
    image: require("../../assets/images/vacuum.jpg"),
    count: 156,
    lister: { name: "Greg G.", avatar: require("../../assets/images/greg.png"), rating: 4.8 },
  },

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
};

const NOTIFY_KEY = "heyneighbor:notifyMe";

export default function ItemData() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // handle id being string or string[]
  const numericId = Array.isArray(id) ? Number(id[0]) : Number(id);

  // item data must be created BEFORE using it in effects
  const item = presetItems[numericId];

  // notify state must exist BEFORE useEffects
  const [isNotified, setIsNotified] = React.useState(false);

  if (!item || Number.isNaN(numericId)) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>Item not found.</Text>
      </View>
    );
  }

  // derive status
  const status: "borrowed" | "none" = item.status ?? "none";

  // check if this item was already subscribed
  useEffect(() => {
    const checkInitialNotify = async () => {
      const raw = await AsyncStorage.getItem(NOTIFY_KEY);
      if (!raw) return;

      const ids: number[] = JSON.parse(raw);
      if (ids.includes(numericId)) {
        setIsNotified(true);
      }
    };

    checkInitialNotify();
  }, [numericId]);

  // show "Good news!" if item is now available
  useEffect(() => {
    const checkNotify = async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIFY_KEY);
        if (!raw) return;

        const ids: number[] = JSON.parse(raw);

        if (ids.includes(numericId) && status === "none") {
          Alert.alert("Good news!", `${item.name} is now available to borrow.`);

          const filtered = ids.filter((x) => x !== numericId);
          await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(filtered));
          setIsNotified(false);
        }
      } catch (err) {
        console.log("Error checking notify list:", err);
      }
    };

    checkNotify();
  }, [numericId, status, item.name]);


  const handleNotifyMe = async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFY_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];

      if (!ids.includes(numericId)) {
        // Add subscribe
        ids.push(numericId);
        await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(ids));
        setIsNotified(true);

        Alert.alert(
          "Notification set",
          `We'll notify you when ${item.name} becomes available.`
        );
      } else {
        // Unsubscribe if clicked again
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

  return (
    <ScrollView style={styles.container}>
      {/* ITEM IMAGE */}
      <Image
        source={item.image}
        style={[styles.image, status === "borrowed" && { opacity: 0.55 }]}
      />

      {/* NAME */}
      <Text style={styles.name}>{item.name}</Text>

      {/* BADGE */}
      {status === "borrowed" && (
        <View style={[styles.badge, styles.borrowed]}>
          <Text style={styles.badgeText}>BORROWED</Text>
        </View>
      )}

      {/* LISTER PROFILE */}
      <View style={styles.listerCard}>
        <Image source={item.lister.avatar} style={styles.avatar} />
        <View>
          <Text style={styles.listerName}>{item.lister.name}</Text>
          <Text style={styles.rating}>⭐ {item.lister.rating}</Text>
        </View>

        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() =>
            router.push({
              pathname: "/chat-thread",
              params: {
                name: item.lister.name,
                avatar: item.lister.avatar,
              },
            })
          }
        >
          <Text style={styles.viewProfileText}>Chat</Text>
        </TouchableOpacity>
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
                image: item.image, // optional: if you want image on confirmation
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
            isNotified && styles.notifyButtonDisabled
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
  container: { flex: 1, backgroundColor: "#fff" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  image: {
    width: "100%",
    height: 330,
    resizeMode: "cover",
    backgroundColor: "#f3f4f6",
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  badge: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  borrowed: { backgroundColor: "#ef4444" },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  count: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 16,
    marginTop: 6,
  },

  // --------- LISTER INFO ---------
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
  listerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  rating: {
    fontSize: 14,
    color: "#6b7280",
  },
  viewProfileButton: {
    marginLeft: "auto",
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

  // --------- BUTTONS ---------
  borrowButton: {
    backgroundColor: "#438732ff",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  notifyButton: {
    backgroundColor: "#f97316",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  notifyText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  notifyButtonDisabled: {
    opacity: 0.6,
  }
});
