import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
} from "react-native";

const logo = require("../assets/images/logo.png");

interface Item {
  id: number;
  name: string;
  image: string;
  count: number;
}

export default function Browse() {
  const [activeTab, setActiveTab] = useState("All");

  const categories = ["All", "Home", "Tools", "Books", "Outdoor"];

  const items: Item[] = [
    { id: 1, name: "Coffee Maker", image: "☕", count: 24 },
    { id: 2, name: "Tool Kit", image: "🧰", count: 18 },
    { id: 3, name: "Bookshelf", image: "📚", count: 12 },
    { id: 4, name: "Tent", image: "⛺", count: 9 },
    { id: 5, name: "Chair", image: "🪑", count: 27 },
    { id: 6, name: "Drill", image: "🔩", count: 7 },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>🔖</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {categories.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Browse Items */}
      <ScrollView contentContainerStyle={styles.itemsGrid}>
        {items.map((item) => (
          <TouchableOpacity key={item.id} style={styles.itemCard}>
            <View style={styles.itemImageContainer}>
              <Text style={styles.itemEmoji}>{item.image}</Text>
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemCount}>{item.count} available</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    fontSize: 22,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#15803d",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  activeTabText: {
    color: "#15803d",
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    justifyContent: "space-between",
  },
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "48%",
    marginBottom: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImageContainer: {
    backgroundColor: "#e5e7eb",
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  itemEmoji: {
    fontSize: 36,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
  },
  itemCount: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
});
