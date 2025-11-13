import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

type ItemDetails = {
  name: string;
  status: "borrowed" | "none";
  image: any;
  count: number;
};

const presetItems: Record<number, ItemDetails> = {
  1: { name: "USB-C Charger", status: "none", image: require("../../assets/images/charger.jpg"), count: 254 },
  2: { name: "Core 100 Book", status: "borrowed", image: require("../../assets/images/corebook.jpg"), count: 243 },
  3: { name: "Office Chair", status: "none", image: require("../../assets/images/chair.jpg"), count: 180 },
};

export default function ItemDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const numericId = Array.isArray(id) ? parseInt(id[0]) : parseInt(id);
  const item = presetItems[numericId];

  return (
    <ScrollView style={styles.container}>
      {/* BACK BUTTON */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>‹ Back</Text>
      </TouchableOpacity>

      {/* ITEM IMAGE */}
      <Image
        source={item.image}
        style={[
          styles.image,
          item.status === "borrowed" && { opacity: 0.55 }
        ]}
      />

      {/* NAME */}
      <Text style={styles.name}>{item.name}</Text>

      {/* STATUS BADGE (ONLY IF BORROWED) */}
      {item.status === "borrowed" && (
        <View style={[styles.statusBadge, styles.statusBorrowed]}>
          <Text style={styles.statusText}>BORROWED</Text>
        </View>
      )}

      {/* COUNT */}
      <Text style={styles.count}>{item.count} available</Text>

      {/* ACTION BUTTONS */}
      {item.status === "none" ? (
        <TouchableOpacity style={styles.borrowButton}>
          <Text style={styles.borrowText}>Borrow Now</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.notifyButton}>
          <Text style={styles.notifyText}>Notify me when available</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  backButton: { padding: 12 },
  backButtonText: { fontSize: 16 },

  image: { width: "100%", height: 300, resizeMode: "cover" },

  name: { fontSize: 22, fontWeight: "700", padding: 16 },

  statusBadge: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: { color: "#fff", fontWeight: "700" },

  // Only borrowed style is needed
  statusBorrowed: { backgroundColor: "#ef4444" },  // red

  count: { fontSize: 16, color: "#6b7280", marginLeft: 16 },

  borrowButton: {
    backgroundColor: "#22c55e",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  notifyButton: {
    backgroundColor: "#f97316",
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  notifyText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
