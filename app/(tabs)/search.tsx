import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// banner image
const banner = require("../../assets/images/banner.png");

// Category data
const categories = [
  { id: 1, title: "Popular" },
  { id: 2, title: "Home" },
  { id: 3, title: "Books" },
  { id: 4, title: "Tools" },
  { id: 5, title: "Everything else" },
];

export default function DiscoverScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SEARCH BAR */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for anything"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* BANNER IMAGE */}
        <View style={styles.bannerContainer}>
          <Image source={banner} style={styles.bannerImage} />
          <View style={styles.bannerOverlay}>
          </View>
        </View>

        {/* CATEGORY SECTION */}
        <Text style={styles.sectionHeader}>Browse by category</Text>

        {categories.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryRow}>
            <Text style={styles.categoryText}>{cat.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#4b5563" />
          </TouchableOpacity>
        ))}

        {/* EXTRA SPACE */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  // SEARCH BAR
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  // BANNER
  bannerContainer: {
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 18,
    left: 18,
  },
  bannerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
  },
  bannerSubtitle: {
    color: "#fff",
    fontSize: 15,
    marginTop: 4,
  },

  // CATEGORY SECTION
  sectionHeader: {
    marginTop: 28,
    marginBottom: 12,
    marginHorizontal: 16,
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  categoryText: {
    fontSize: 17,
    color: "#1f2937",
  },
});
