import React, { useState, useMemo } from "react";
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
import { useRouter } from "expo-router";
const charger = require("../../assets/images/charger.jpg");
const corebook = require("../../assets/images/corebook.jpg");
const chair = require("../../assets/images/chair.jpg");
const tools = require("../../assets/images/tools.jpg");
const tractor = require("../../assets/images/tractor.jpg");
const vacuum = require("../../assets/images/vacuum.jpg");
const keurig = require("../../assets/images/keurig.png");
const desklamp = require("../../assets/images/desklamp.jpeg");
const speaker = require("../../assets/images/speaker.jpg");
const bike = require("../../assets/images/bike.jpg");
const cookset = require("../../assets/images/cookset.jpg");
const yogamat = require("../../assets/images/yogamat.jpg");
const wirelessbuds = require("../../assets/images/wirelessbuds.jpg");
const standingdesk = require("../../assets/images/standingdesk.jpg");
const electrickettle = require("../../assets/images/electrickettle.jpg");
const campingtent = require("../../assets/images/campingtent.jpg");
const electricdrill = require("../../assets/images/drill.jpg");
const cookbook = require("../../assets/images/cookbook.jpg");
const smartwatch = require("../../assets/images/smartwatch.jpg");
const pressurewasher = require("../../assets/images/pressurewasher.jpg");
const laptopstand = require("../../assets/images/laptopstand.jpg");
const gardenhose = require("../../assets/images/hose.jpg");

const presetItems = [
  { id: 1, name: "USB-C Charger", image: charger, category: "Popular", status: "none" },
  { id: 2, name: "Core 100 Book", image: corebook, category: "Books", status: "borrowed" },
  { id: 3, name: "Office Chair", image: chair, category: "Home", status: "none" },
  { id: 4, name: "Keurig", image: keurig, category: "Home", status: "none" },
  { id: 5, name: "Tool Set", image: tools, category: "Tools", status: "none" },
  { id: 6, name: "Garden Tractor", image: tractor, category: "Tools", status: "none" },
  { id: 7, name: "Vacuum", image: vacuum, category: "Home", status: "borrowed" },
  { id: 8, name: "Desk Lamp", image: desklamp, category: "Home", status: "none" },
  { id: 9, name: "Bluetooth Speaker", image: speaker, category: "Popular", status: "none" },
  { id: 10, name: "Mountain Bike", image: bike, category: "Tools", status: "none" },
  { id: 11, name: "Cookware Set", image: cookset, category: "Home", status: "borrowed" },
  { id: 12, name: "Yoga Mat", image: yogamat, category: "Popular", status: "none" },
  { id: 13, name: "Wireless Headphones", image: wirelessbuds, category: "Popular", status: "none" },
  { id: 14, name: "Standing Desk", image: standingdesk, category: "Home", status: "none" },
  { id: 15, name: "Electric Kettle", image: electrickettle, category: "Home", status: "none" },
  { id: 16, name: "Camping Tent", image: campingtent, category: "Tools", status: "none" },
  { id: 17, name: "Electric Drill", image: electricdrill, category: "Tools", status: "borrowed" },
  { id: 18, name: "Cookbook", image: cookbook, category: "Books", status: "none" },
  { id: 19, name: "Smartwatch", image: smartwatch, category: "Popular", status: "none" },
  { id: 20, name: "Pressure Washer", image: pressurewasher, category: "Tools", status: "none" },
  { id: 21, name: "Laptop Stand", image: laptopstand, category: "Popular", status: "none" },
  { id: 22, name: "Garden Hose", image: gardenhose, category: "Tools", status: "none" },
];

const banner = require("../../assets/images/banner.png");

const categories = ["Popular", "Home", "Books", "Tools"];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Popular");

  // Filter items
  const filteredItems = useMemo(() => {
    return presetItems.filter((item) => {
      const matchesCategory =
        activeCategory === "Popular" || item.category === activeCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

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

        {/* BANNER */}
        <View style={styles.bannerContainer}>
          <Image source={banner} style={styles.bannerImage} />
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.tabs}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.activeTab]}
              onPress={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  activeCategory === cat && styles.activeTabText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ITEMS GRID */}
        <View style={styles.grid}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <Image
                source={item.image}
                style={[styles.cardImage, item.status === "borrowed" && { opacity: 0.55 }]}
              />
              <Text style={styles.cardName}>{item.name}</Text>

              {item.status === "borrowed" && (
                <View style={styles.borrowedBadge}>
                  <Text style={styles.borrowedText}>Borrowed</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// -------- STYLES --------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

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

  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 180,
  },

  tabs: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  activeTab: {
    backgroundColor: "#f97316",
  },
  tabText: {
    color: "#6b7280",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 130,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    padding: 10,
    color: "#111827",
  },

  borrowedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f87171",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  borrowedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
