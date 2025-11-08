import React from "react";
import { TouchableOpacity, Image, StyleSheet, ViewStyle } from "react-native";
import { useRouter } from "expo-router";

const closeIcon = require("../../assets/images/close.png");

export default function CloseButton({ style }: { style?: ViewStyle }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.push("/")}
      style={[styles.button, style]}
    >
      <Image source={closeIcon} style={styles.icon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    top: 10,
    left: 12,
    zIndex: 10,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: "#4b5563",
  },
});

