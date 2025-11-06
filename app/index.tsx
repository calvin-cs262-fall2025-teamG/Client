import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from "react-native";
import type { ImageSourcePropType } from "react-native";
import BookmarkHeaderIcon from "./components/BookmarkHeaderIcon";
import BookmarkButton from "./components/BookmarkButton";

const logo = require("../assets/images/logo.png");


const charger = require("../assets/images/charger.jpg");
const corebook = require("../assets/images/corebook.jpg");
const chair = require("../assets/images/chair.jpg");
const tools = require("../assets/images/tools.jpg");
const tractor = require("../assets/images/tractor.jpg");
const vacuum = require("../assets/images/vacuum.jpg");

const cartIcon = require("../assets/images/cart.png");
const bookmarkIcon = require("../assets/images/bookmark.png");
const searchIcon = require("../assets/images/search.png");
const homeIcon = require("../assets/images/home.png");
const listIcon = require("../assets/images/list.png");
const chatIcon = require("../assets/images/chat.png");
const profileIcon = require("../assets/images/profile.png");

interface Item {
  id: number;
  name: string;
  count: number;
  image: ImageSourcePropType;
  category: string;
}

export default function Index() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Popular");

  const allItems: Item[] = [
    { id: 1, name: "USBC Charger", count: 254, image: charger, category: "Popular" },
    { id: 2, name: "Core 100 Book", count: 243, image: corebook, category: "Books" },
    { id: 3, name: "Chair", count: 180, image: chair, category: "Home" },
    { id: 4, name: "Tools", count: 156, image: tools, category: "Tools" },
    { id: 5, name: "Tractor", count: 180, image: tractor, category: "Tools" },
    { id: 6, name: "Vacuum", count: 156, image: vacuum, category: "Home" },
  ];

  const filteredItems = allItems.filter((item) => {
    if (activeTab === "Popular") return true;
    return item.category === activeTab;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />

        <View style={styles.searchContainer}>
          <Image source={searchIcon} style={styles.searchIconImage} resizeMode="contain" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.iconGroup}>
          <BookmarkHeaderIcon />
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/cart")}>
            <Image source={cartIcon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.tabContainer}>
          {["Popular", "Home", "Books", "Tools"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.recommendedGrid}>
          {filteredItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.recommendedItem}>
              <View style={styles.recommendedImageContainer}>
                <Image source={item.image} style={styles.recommendedImage} resizeMode="cover" />
                <View style={styles.heartOverlayBig}>
                  <BookmarkButton item={{ id: String(item.id), title: item.name }} size={20} />
                </View>
              </View>
              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.countRow}>
                  <Text style={styles.countTextSmall}>{item.count}</Text>
                  <Image
                    source={bookmarkIcon}
                    style={styles.smallBookmarkIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Image source={homeIcon} style={styles.navIconImage} resizeMode="contain" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/browse")}>
          <Image source={searchIcon} style={styles.navIconImage} resizeMode="contain" />
          <Text style={styles.navText}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Image source={listIcon} style={styles.navIconImage} resizeMode="contain" />
          <Text style={styles.navText}>List</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/chat")}>
          <Image source={chatIcon} style={styles.navIconImage} resizeMode="contain" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/profile")}>
          <Image source={profileIcon} style={styles.navIconImage} resizeMode="contain" />
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
  searchIconImage: {
    width: 18,
    height: 18,
    marginRight: 8,
    alignSelf: "center",
  },
  smallBookmarkIcon: {
    width: 14,
    height: 14,
    marginLeft: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  navIconImage: {
    width: 24,
    height: 24,
    marginBottom: 4,
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
    position: "relative",
    overflow: "hidden",
  },
  recommendedImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heartOverlayBig: {
    position: "absolute",
    top: 10,
    right: 10,
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
