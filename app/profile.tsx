// ProfileScreen.tsx
import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from "react-native";

const logo = require("../assets/images/logo.png");

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logo} />
        <Text style={styles.title}>Your Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileCard}>
        <Image
          source={{ uri: "https://via.placeholder.com/100" }}
          style={styles.avatar}
        />
        <Text style={styles.name}>Maham Abrar</Text>
        <Text style={styles.role}>Data & Software Enthusiast 💻</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.logoutButton]}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    width: "100%",
    backgroundColor: "#15803d",
  },
  logo: { width: 40, height: 40, marginRight: 10 },
  title: { color: "#fff", fontSize: 20, fontWeight: "600" },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    width: "90%",
    marginTop: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: "600" },
  role: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  buttonContainer: { marginTop: 40, width: "80%" },
  button: {
    backgroundColor: "#15803d",
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  logoutButton: { backgroundColor: "#dc2626" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
});
