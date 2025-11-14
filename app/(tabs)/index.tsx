import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBookmarksUnsafe } from "../../context/BookmarksContext";
import {
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
const vacuum2 = require("../../assets/images/vacuum2.jpg");
const vacuum3 = require("../../assets/images/vacuum3.jpg");
const vacuum4 = require("../../assets/images/vacuum4.jpg");
const vacuum5 = require("../../assets/images/vacuum5.jpg");
const vacuum6 = require("../../assets/images/vacuum6.jpg");

interface Item {
  id: number;
  name: string;
  count: number;
  image: any;
  category: string;
  status: "none" | "borrowed";
}

export default function Index() {
  const router = useRouter();
  const bookmarkCtx = useBookmarksUnsafe();

  const {
    isSaved = () => false,
    toggle = () => { },
    ids = new Set(),
  } = bookmarkCtx || {};

  const [activeTab, setActiveTab] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });

  const searchInputRef = useRef<TextInput>(null);
  const searchBarRef = useRef<View>(null);

  const presetItems: Item[] = [
    { id: 1, name: "USB-C Charger", count: 254, image: charger, category: "Popular", status: "none" },
    { id: 2, name: "Core 100 Book", count: 243, image: corebook, category: "Books", status: "borrowed" },
    { id: 3, name: "Office Chair", count: 180, image: chair, category: "Home", status: "none" },
    { id: 4, name: "Keurig", count: 180, image: keurig, category: "Home", status: "borrowed" },
    { id: 5, name: "Tool Set", count: 156, image: tools, category: "Tools", status: "none" },
    { id: 6, name: "Garden Tractor", count: 180, image: tractor, category: "Tools", status: "none" },
    { id: 7, name: "Vacuum", count: 156, image: vacuum, category: "Home", status: "borrowed" },
    { id: 8, name: "Desk Lamp", count: 120, image: desklamp, category: "Home", status: "none" },
    { id: 9, name: "Bluetooth Speaker", count: 95, image: speaker, category: "Popular", status: "none" },
    { id: 10, name: "Mountain Bike", count: 110, image: bike, category: "Tools", status: "none" },
    { id: 11, name: "Cookware Set", count: 85, image: cookset, category: "Home", status: "borrowed" },
    { id: 12, name: "Yoga Mat", count: 70, image: yogamat, category: "Popular", status: "none" },
    { id: 13, name: "Wireless Headphones", count: 130, image: wirelessbuds, category: "Popular", status: "none" },
    { id: 14, name: "Standing Desk", count: 90, image: standingdesk, category: "Home", status: "none" },
    { id: 15, name: "Electric Kettle", count: 85, image: electrickettle, category: "Home", status: "none" },
    { id: 16, name: "Camping Tent", count: 120, image: campingtent, category: "Tools", status: "none" },
    { id: 17, name: "Electric Drill", count: 140, image: electricdrill, category: "Tools", status: "borrowed" },
    { id: 18, name: "Cookbook", count: 110, image: cookbook, category: "Books", status: "none" },
    { id: 19, name: "Smartwatch", count: 150, image: smartwatch, category: "Popular", status: "none" },
    { id: 20, name: "Pressure Washer", count: 100, image: pressurewasher, category: "Tools", status: "none" },
    { id: 21, name: "Laptop Stand", count: 120, image: laptopstand, category: "Popular", status: "none" },
    { id: 22, name: "Garden Hose", count: 110, image: gardenhose, category: "Tools", status: "none" },
    { id: 23, name: "Vacuum", count: 156, image: vacuum2, category: "Home", status: "none" },
    { id: 24, name: "Vacuum", count: 156, image: vacuum3, category: "Home", status: "none" },
    { id: 25, name: "Vacuum", count: 156, image: vacuum4, category: "Home", status: "borrowed" },
    { id: 26, name: "Vacuum", count: 156, image: vacuum5, category: "Home", status: "borrowed" },
    { id: 27, name: "Vacuum", count: 156, image: vacuum6, category: "Home", status: "none" },
  ];

  // Get bookmark count from context
  const bookmarkCount = ids.size;

  useEffect(() => {
    const loadSearches = async () => {
      const saved = await AsyncStorage.getItem("recentSearches");
      if (saved) setRecentSearches(JSON.parse(saved));
    };
    loadSearches();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  useEffect(() => {
    if (searchQuery.length > 0 && searchBarRef.current) {
      searchBarRef.current.measure((x, y, width, height, pageX, pageY) => {
        setDropdownLayout({
          top: pageY + height + 4,
          left: pageX,
          width: width,
        });
      });
    }
  }, [searchQuery]);

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches([trimmed, ...recentSearches].slice(0, 5));
    }
  };

  const handleClearRecentSearches = async () => {
    await AsyncStorage.removeItem("recentSearches");
    setRecentSearches([]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    const saved = await AsyncStorage.getItem("recentSearches");
    if (saved) setRecentSearches(JSON.parse(saved));
    setRefreshing(false);
  };

  const handleBookmarkToggle = (item: Item) => {
    toggle({
      id: String(item.id),
      title: item.name,
      image: item.image,
      count: item.count,
      status: item.status,
      category: item.category,
    });
  };

  const filteredItems = presetItems.filter((item) => {
    const matchesCategory = activeTab === "Popular" || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={styles.logoImage}
        />

        <View ref={searchBarRef} style={styles.searchBar}>
          <Ionicons
            name="search"
            size={18}
            color="#6b7280"
            style={{ marginRight: 8 }}
          />

          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search items"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            onSubmitEditing={handleSearchSubmit}
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                searchInputRef.current?.blur();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.iconGroup}>
          <TouchableOpacity
            onPress={() => router.push("/bookmark")}
            style={styles.bookmarkHeaderContainer}
          >
            <Ionicons name="bookmark" size={24} color="#3b1b0d" />
            {bookmarkCount > 0 && (
              <View style={styles.bookmarkBadge}>
                <Text style={styles.bookmarkBadgeText}>
                  {bookmarkCount > 99 ? '99+' : bookmarkCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* RECENT SEARCH DROPDOWN */}
      {searchQuery.length > 0 && recentSearches.length > 0 && (
        <View
          style={[
            styles.recentDropdown,
            {
              top: dropdownLayout.top,
              left: dropdownLayout.left,
              width: dropdownLayout.width,
            },
          ]}
        >
          {recentSearches.slice(0, 5).map((term, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSearchQuery(term);
                searchInputRef.current?.blur();
              }}
              style={styles.recentRow}
            >
              <Ionicons name="time-outline" size={16} color="#6b7280" />
              <Text style={styles.recentRowText}>{term}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            onPress={handleClearRecentSearches}
            style={styles.recentClearRow}
          >
            <Text style={styles.recentClearText}>Clear recent searches</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* TABS */}
        <View style={styles.tabContainer}>
          {["Popular", "Home", "Books", "Tools"].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery("");
              }}
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

        {/* ITEMS GRID */}
        <View style={styles.recommendedGrid}>
          {filteredItems.map((item) => {
            const isBookmarked = isSaved(String(item.id));

            return (
              <View key={item.id} style={styles.recommendedItem}>
                {/* IMAGE + BOOKMARK */}
                <View style={styles.recommendedImageContainer}>
                  {/* Bookmark Icon */}
                  <TouchableOpacity
                    style={styles.bookmarkIconContainer}
                    onPress={() => handleBookmarkToggle(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isBookmarked ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color="#3b1b0d"
                    />
                  </TouchableOpacity>

                  {/* Navigate via image */}
                  <TouchableOpacity
                    onPress={() => router.push(`/item/${item.id}`)}
                    activeOpacity={0.8}
                  >
                    <Image
                      source={item.image}
                      style={[
                        styles.recommendedImage,
                        item.status === "borrowed" && { opacity: 0.55 },
                      ]}
                    />
                  </TouchableOpacity>

                  {/* Borrowed badge */}
                  {item.status === "borrowed" && (
                    <View style={[styles.statusBadge, styles.statusBorrowed]}>
                      <Text style={styles.statusText}>Borrowed</Text>
                    </View>
                  )}
                </View>

                {/* Navigate via info section */}
                <TouchableOpacity
                  onPress={() => router.push(`/item/${item.id}`)}
                  activeOpacity={0.8}
                  style={styles.recommendedInfo}
                >
                  <Text
                    style={[
                      styles.recommendedName,
                      item.status === "borrowed" && { opacity: 0.7 },
                    ]}
                  >
                    {item.name}
                  </Text>

                  <View style={styles.countRow}>
                    <Ionicons
                      name="bookmark"
                      size={14}
                      color="#3b1b0d"
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.countText,
                        item.status === "borrowed" && { opacity: 0.7 },
                      ]}
                    >
                      {item.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  logoImage: {
    width: 55,
    height: 55,
    borderRadius: 12,
  },

  searchBar: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },

  iconGroup: {
    flexDirection: "row",
    gap: 14,
  },

  bookmarkHeaderContainer: {
    position: "relative",
  },

  bookmarkBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    backgroundColor: "#f97316",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },

  bookmarkBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  // RECENT DROPDOWN
  recentDropdown: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },

  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    gap: 10,
    borderRadius: 8,
  },

  recentRowText: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
  },

  recentClearRow: {
    marginTop: 2,
    paddingTop: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    alignItems: "center",
  },

  recentClearText: {
    color: "#f97316",
    fontSize: 13,
    fontWeight: "600",
  },

  // TABS
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },

  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#f97316",
  },

  tabText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },

  activeTabText: {
    color: "#f97316",
    fontWeight: "600",
  },

  // ITEMS
  scrollView: {
    flex: 1,
  },

  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 12,
  },

  recommendedItem: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  recommendedImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f3f4f6",
  },

  recommendedImage: {
    width: "100%",
    height: "100%",
  },

  recommendedInfo: {
    padding: 12,
  },

  recommendedName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },

  countText: {
    fontSize: 13,
    color: "#6b7280",
  },

  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    zIndex: 10,
  },

  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  statusBorrowed: {
    backgroundColor: "#f73e3eaf",
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  bookmarkIcon: {
    marginLeft: 8,
  },

  bookmarkIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 6,
    borderRadius: 20,
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
});