import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
    lister: {
      name: "Laila M.",
      avatar: require("../../assets/images/laila.png"),
      rating: 4.9,
    },
  },
  2: {
    name: "Core 100 Book",
    status: "borrowed",
    image: require("../../assets/images/corebook.jpg"),
    count: 243,
    lister: {
      name: "Rose C.",
      avatar: require("../../assets/images/rose.png"),
      rating: 4.7,
    },
  },
  3: {
    name: "Office Chair",
    status: "none",
    image: require("../../assets/images/chair.jpg"),
    count: 180,
    lister: {
      name: "Chloe K.",
      avatar: require("../../assets/images/chloe.png"),
      rating: 5.0,
    },
  },
  4: {
    name: "Keurig",
    status: "none",
    image: require("../../assets/images/keurig.png"),
    count: 180,
    lister: {
      name: "Bryn L.",
      avatar: require("../../assets/images/bryn.png"),
      rating: 4.8,
    },
  },
  5: {
    name: "Tool Set",
    status: "none",
    image: require("../../assets/images/tools.jpg"),
    count: 156,
    lister: {
      name: "Jacob W.",
      avatar: require("../../assets/images/jacob.png"),
      rating: 4.6,
    },
  },
  6: {
    name: "Garden Tractor",
    status: "none",
    image: require("../../assets/images/tractor.jpg"),
    count: 180,
    lister: {
      name: "Helen P.",
      avatar: require("../../assets/images/helen.png"),
      rating: 4.9,
    },
  },
  7: {
    name: "Vacuum",
    status: "borrowed",
    image: require("../../assets/images/vacuum.jpg"),
    count: 156,
    lister: {
      name: "Greg G.",
      avatar: require("../../assets/images/greg.png"),
      rating: 4.8,
    },
  },
};

export default function ItemData() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const numericId = Number(id);
  const item = presetItems[numericId];

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>Item not found.</Text>
      </View>
    );
  }

  // -------- ADD TO CART FUNCTION ----------
  const addToCart = async () => {
    try {
      const existing = await AsyncStorage.getItem("cart");
      let cart = existing ? JSON.parse(existing) : [];

      // prevent duplicates
      if (!cart.some((c: any) => c.id === numericId)) {
        cart.push({
          id: numericId,
          name: item.name,
          image: item.image,
        });
      }

      await AsyncStorage.setItem("cart", JSON.stringify(cart));

      // navigate to cart
      router.push("/cart");
    } catch (err) {
      console.log("Error adding to cart:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>

      {/* ITEM IMAGE */}
      <Image
        source={item.image}
        style={[styles.image, item.status === "borrowed" && { opacity: 0.55 }]}
      />

      {/* NAME */}
      <Text style={styles.name}>{item.name}</Text>

      {/* BADGE */}
      {item.status === "borrowed" && (
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
              pathname: "/profile/[name]",
              params: { name: item.lister.name },
            })
          }
        >
          <Text style={styles.viewProfileText}>View Profile</Text>
        </TouchableOpacity>
      </View>

      {/* ACTION BUTTONS */}

      {item.status === "none" ? (
        <TouchableOpacity style={styles.borrowButton} onPress={addToCart}>
          <Text style={styles.borrowText}>Borrow Now</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.notifyButton}>
          <Text style={styles.notifyText}>Notify Me</Text>
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
    backgroundColor: "#22c55e",
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
});
