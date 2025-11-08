import React from "react";
import { TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

const closeIcon = require("../../assets/images/close.png");

export default function CloseButton() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.closeButton} onPress={() => router.push("/")}>
      <Image source={closeIcon} style={styles.closeIcon} resizeMode="contain" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 50, // adjust for notch if needed
    left: 20,
    zIndex: 10,
    backgroundColor: "#ffffffaa",
    borderRadius: 20,
    padding: 6,
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: "#000",
  },
});
