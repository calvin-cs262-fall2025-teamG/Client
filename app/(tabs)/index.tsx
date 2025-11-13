import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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

  const [activeTab, setActiveTab] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ top: 0, left: 0, width: 0 });


  const searchInputRef = useRef<TextInput>(null);
  const searchBarRef = useRef<View>(null);

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

  const presetItems: Item[] = [
    { id: 1, name: "USB-C Charger", count: 254, image: charger, category: "Popular", status: "none" },
    { id: 2, name: "Core 100 Book", count: 243, image: corebook, category: "Books", status: "borrowed" },
    { id: 3, name: "Office Chair", count: 180, image: chair, category: "Home", status: "none" },
    { id: 4, name: "Tool Set", count: 156, image: tools, category: "Tools", status: "none" },
    { id: 5, name: "Garden Tractor", count: 180, image: tractor, category: "Tools", status: "none" },
    { id: 6, name: "Vacuum Cleaner", count: 156, image: vacuum, category: "Home", status: "borrowed" },
  ];

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
          <Ionicons name="search" size={18} color="#6b7280" style={{ marginRight: 8 }} />

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
          <TouchableOpacity onPress={() => router.push("/bookmark")}>
            <Ionicons name="bookmark-outline" size={24} color="#1f2937" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/cart")}>
            <Ionicons name="cart-outline" size={24} color="#1f2937" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ITEMS GRID */}
        <View style={styles.recommendedGrid}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.recommendedItem}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <View style={styles.recommendedImageContainer}>
                {item.status === "borrowed" && (
                  <View style={[styles.statusBadge, styles.statusBorrowed]}>
                    <Text style={styles.statusText}>Borrowed</Text>
                  </View>
                )}

                <Image
                  source={item.image}
                  style={[
                    styles.recommendedImage,
                    item.status === "borrowed" && { opacity: 0.55 },
                  ]}
                />
              </View>

              <View style={styles.recommendedInfo}>
                <Text
                  style={[
                    styles.recommendedName,
                    item.status === "borrowed" && { opacity: 0.7 },
                  ]}
                >
                  {item.name}
                </Text>

                <Text
                  style={[
                    styles.countText,
                    item.status === "borrowed" && { opacity: 0.7 },
                  ]}
                >
                  {item.count} available
                </Text>
              </View>
            </TouchableOpacity>

          ))}
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
    backgroundColor: "#f73e3eaf", // red
  },

});