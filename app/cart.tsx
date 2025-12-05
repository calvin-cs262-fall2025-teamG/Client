import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, getBorrowRequestsByUserId, getItemById, User } from "../lib/api";

type CartItem = {
  id: number;
  name: string;
  owner: string;
  quantity: number;
  image_url?: string;
  request_status: string;
  request_id?: number;
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Load borrow requests from database on mount
  useEffect(() => {
    const loadRequests = async () => {
      try {
        if (!user?.user_id) return;
        
        // Get all borrow requests for current user
        const requests = await getBorrowRequestsByUserId(user.user_id);
        
        // Get all users to map user_id to name
        const users = await getAllUsers();
        const userMap: Record<number, User> = {};
        users.forEach((u) => {
          userMap[u.user_id] = u;
        });

        // Build cart items from requests
        const items: CartItem[] = [];
        for (const request of requests) {
          const item = await getItemById(request.item_id);
          if (item) {
            const owner = userMap[item.owner_id];
            items.push({
              id: item.item_id,
              name: item.name,
              owner: owner?.name || "Unknown",
              quantity: 1,
              image_url: item.image_url,
              request_status: request.status,
              request_id: request.request_id,
            });
          }
        }
        setCartItems(items);
      } catch (error) {
        console.error("Failed to load requests:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, [user]);

  const incrementQuantity = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const totalPrice = cartItems.reduce(
    (total) => total + 1,
    0
  );

  const checkout = () => {
    Alert.alert("Checkout", `You have ${cartItems.length} borrow requests.`, [
      { text: "OK" },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.cartImage} />
        ) : (
          <View style={[styles.cartImage, { backgroundColor: "#e5e7eb" }]} />
        )}
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.ownerText}>From: {item.owner}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.request_status) }]}>
          <Text style={styles.statusText}>{item.request_status.toUpperCase()}</Text>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Text style={styles.removeButton}>Remove Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#3b1b0d" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Borrow Requests</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>You have no active borrow requests.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.total}>Total Requests: {cartItems.length}</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={checkout}>
          <Text style={styles.checkoutButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 120,
    aspectRatio: 1,
    backgroundColor: "#f3f4f6",
  },
  cartImage: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  itemName: { fontSize: 18, fontWeight: "600", color: "#111827" },
  ownerText: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  itemPrice: { fontSize: 16, fontWeight: "600", color: "#4b5563" },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  quantityButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quantityButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    minWidth: 20,
    textAlign: "center",
    color: "#111827",
  },
  removeButton: {
    color: "#ef4444",
    marginTop: 10,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 40,
    fontSize: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
    marginTop: 10,
  },
  total: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    textAlign: "right",
  },
  checkoutButton: {
    backgroundColor: "#f97316",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
