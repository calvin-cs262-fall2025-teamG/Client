import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function BorrowConfirmation() {
  const router = useRouter();
  const { itemName, listerName, image } = useLocalSearchParams();

  // must happen AFTER loading params
  const cleanImage = Array.isArray(image) ? image[0] : image;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Checkmark Icon */}
        <View style={styles.checkContainer}>
          <Ionicons name="checkmark-circle" size={70} color="#3b1b0d" />
        </View>

        {/* Item Image */}
        {cleanImage && (
          <Image
            source={
              /^\d+$/.test(cleanImage)
                ? Number(cleanImage)         // require() image ID
                : { uri: cleanImage }        // URL
            }
            style={styles.itemImage}
            resizeMode="cover"
          />
        )}

        {/* Title */}
        <Text style={styles.title}>Borrow Request Sent!</Text>

        {/* Message */}
        <Text style={styles.message}>
          Your request to borrow <Text style={styles.bold}>{itemName}</Text> has
          been sent to <Text style={styles.bold}>{listerName}</Text>.
        </Text>

        <Text style={[styles.message, { marginTop: 8 }]}>
          They have <Text style={styles.bold}>24 hours</Text> to accept or
          decline your request. You’ll be notified as soon as they respond.
        </Text>

        <Text style={[styles.message, { marginTop: 8 }]}>
          Once accepted, you will be able to coordinate pickup details in chat.
        </Text>
      </View>

      {/* Return Home */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/")}
      >
        <Text style={styles.buttonText}>Return Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  checkContainer: { marginBottom: 16 },

  itemImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 18,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },

  message: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
  },

  bold: {
    fontWeight: "600",
    color: "#3b1b0d",
  },

  button: {
    marginTop: 24,
    backgroundColor: "#3b1b0d",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
