import React, { useState } from "react";
import { Image } from "react-native";
const logo = require("../assets/images/logo.png");

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";

interface Item {
  id: number;
  name: string;
  count: number;
  image: string;
}

export default function Index() {
  const [activeTab, setActiveTab] = useState("Popular");

  const listings: Item[] = [
    { id: 1, name: "Tractor", count: 3, image: "🚜" },
    { id: 2, name: "Tools", count: 5, image: "🔧" },
    { id: 3, name: "Hose", count: 8, image: "💧" },
    { id: 4, name: "Chair", count: 15, image: "🪑" },
    { id: 5, name: "Vacuum", count: 1, image: "🧹" },
    { id: 6, name: "Couch", count: 12, image: "🛋️" },
    { id: 7, name: "Table", count: 10, image: "🪑" },
    { id: 8, name: "Skate", count: 6, image: "🛹" },
  ];

  const recommended: Item[] = [
    { id: 1, name: "USBC Charger", count: 254, image: "🔌" },
    { id: 2, name: "Core 100 Book", count: 243, image: "📚" },
    { id: 3, name: "Keurig", count: 180, image: "☕" },
    { id: 4, name: "Camping Tent", count: 156, image: "⛺" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.iconGroup}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>🔖</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.icon}>🛍️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Your Listings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Your Listings</Text>
        </View>

        <View style={styles.listingsGrid}>
          {listings.map((item) => (
            <TouchableOpacity key={item.id} style={styles.listingItem}>
              <View style={styles.listingImageContainer}>
                <Text style={styles.listingEmoji}>{item.image}</Text>
              </View>
              <Text style={styles.listingName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.countRow}>
                <Text style={styles.countText}>{item.count}</Text>
                <Text style={styles.bookmarkIcon}>🔖</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Items Section */}
        <View style={[styles.sectionHeader, styles.orangeHeader]}>
          <Text style={styles.sectionHeaderText}>Recommended Items</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {["Popular", "Home", "Books", "Tools"].map((tab) => (
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

        {/* Recommended Grid */}
        <View style={styles.recommendedGrid}>
          {recommended.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recommendedItem}>
              <View style={styles.recommendedImageContainer}>
                <Text style={styles.recommendedEmoji}>{item.image}</Text>
              </View>
              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.countRow}>
                  <Text style={styles.countTextSmall}>{item.count}</Text>
                  <Text style={styles.bookmarkIconSmall}>🔖</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIconActive}>🏠</Text>
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🧭</Text>
          <Text style={styles.navText}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.navIconLarge]}>➕</Text>
          <Text style={styles.navText}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
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
    width: 60,
    height: 60,
  },
  logo: {
    fontSize: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  icon: {
    fontSize: 22,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    backgroundColor: "#15803d",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  orangeHeader: {
    backgroundColor: "#f97316",
  },
  sectionHeaderText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
  },
  listingsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#ffffff",
  },
  listingItem: {
    width: "25%",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  listingImageContainer: {
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  listingEmoji: {
    fontSize: 36,
  },
  listingName: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    width: "100%",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: 11,
    color: "#4b5563",
  },
  bookmarkIcon: {
    fontSize: 10,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  activeTabText: {
    color: "#f97316",
  },
  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  recommendedItem: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    marginBottom: 12,
    marginHorizontal: "1%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recommendedImageContainer: {
    backgroundColor: "#e5e7eb",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  recommendedEmoji: {
    fontSize: 60,
  },
  recommendedInfo: {
    padding: 12,
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  countTextSmall: {
    fontSize: 12,
    color: "#4b5563",
  },
  bookmarkIconSmall: {
    fontSize: 10,
  },
  bottomNav: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  navIconLarge: {
    fontSize: 28,
  },
  navText: {
    fontSize: 11,
    color: "#4b5563",
  },
  navTextActive: {
    fontSize: 11,
    color: "#374151",
  },
});
