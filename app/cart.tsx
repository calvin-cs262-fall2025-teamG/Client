import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";

const chargerImage = require("../assets/images/charger.jpg");
const chairImage = require("../assets/images/chair.jpg");
const tractorImage = require("../assets/images/tractor.jpg");

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: any;
};

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: "1",
      name: "USB-C Charger",
      price: 10.99,
      quantity: 1,
      image: chargerImage,
    },
    { id: "2", name: "Office Chair", price: 59.99, quantity: 2, image: chairImage },
    {
      id: "3",
      name: "Garden Tractor",
      price: 249.99,
      quantity: 1,
      image: tractorImage,
    },
  ]);

  const incrementQuantity = (id: string) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrementQuantity = (id: string) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const checkout = () => {
    Alert.alert("Checkout", `Your total is $${totalPrice.toFixed(2)}.`, [
      { text: "OK" },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.cartImage} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            onPress={() => decrementQuantity(item.id)}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => incrementQuantity(item.id)}
            style={styles.quantityButton}
          >
            <Text style={styles.quantityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => removeItem(item.id)}>
          <Text style={styles.removeButton}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Cart</Text>
      {cartItems.length === 0 ? (
        <Text style={styles.emptyText}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <View style={styles.footer}>
        <Text style={styles.total}>Total: ${totalPrice.toFixed(2)}</Text>
        <TouchableOpacity style={styles.checkoutButton} onPress={checkout}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
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
