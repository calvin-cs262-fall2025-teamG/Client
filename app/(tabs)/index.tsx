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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";

const logo = require("../../assets/images/logo.png");

const charger = require("../../assets/images/charger.jpg");
const corebook = require("../../assets/images/corebook.jpg");
const chair = require("../../assets/images/chair.jpg");
const tools = require("../../assets/images/tools.jpg");
const tractor = require("../../assets/images/tractor.jpg");
const vacuum = require("../../assets/images/vacuum.jpg");
const closeIcon = require("../../assets/images/close.png");

interface Item {
  id: number;
  name: string;
  count: number;
  image: ImageSourcePropType | string;
  category: string;
}

export default function Index() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userItems, setUserItems] = useState<Item[]>([]);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadSearches = async () => {
      try {
        const saved = await AsyncStorage.getItem("recentSearches");
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch (err) {
        console.error("Error loading recent searches", err);
      }
    };
    loadSearches();
  }, []);

  useEffect(() => {
    const loadUserItems = async () => {
      const stored = await AsyncStorage.getItem("userItems");
      if (stored) {
        setUserItems(JSON.parse(stored));
      }
    };

    loadUserItems();
  }, []);

  useEffect(() => {
    const saveSearches = async () => {
      try {
        await AsyncStorage.setItem("recentSearches", JSON.stringify(recentSearches));
      } catch (err) {
        console.error("Error saving recent searches", err);
      }
    };
    saveSearches();
  }, [recentSearches]);

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (trimmed && !recentSearches.includes(trimmed)) {
      setRecentSearches([trimmed, ...recentSearches].slice(0, 5));
    }
    setIsSearchFocused(false);
  };

  const handleClearRecentSearches = async () => {
    try {
      await AsyncStorage.removeItem("recentSearches");
      setRecentSearches([]);
    } catch (err) {
      console.error("Error clearing recent searches", err);
    }
  };

  const presetItems: Item[] = [
    { id: 1, name: "USBC Charger", count: 254, image: charger, category: "Popular" },
    { id: 2, name: "Core 100 Book", count: 243, image: corebook, category: "Books" },
    { id: 3, name: "Chair", count: 180, image: chair, category: "Home" },
    { id: 4, name: "Tools", count: 156, image: tools, category: "Tools" },
    { id: 5, name: "Tractor", count: 180, image: tractor, category: "Tools" },
    { id: 6, name: "Vacuum", count: 156, image: vacuum, category: "Home" },
  ];

  const allItems = [...userItems, ...presetItems];

  const filteredItems = allItems.filter((item) => {
    const matchesCategory = activeTab === "Popular" || item.category === activeTab;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={logo} style={styles.logoImage} resizeMode="contain" />

        <View style={styles.searchContainer}>
          <Image
            source={require("../../assets/images/close.png")}
            style={styles.searchIconImage}
            resizeMode="contain"
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            onFocus={() => setIsSearchFocused(true)}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />

          {(isSearchFocused || searchQuery.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setIsSearchFocused(false);
                setActiveTab("Popular");
                searchInputRef.current?.blur(); // hides cursor and keyboard
              }}
            >
              <Image
                source={closeIcon}
                style={styles.closeIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.iconGroup}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/bookmark")}
          >
            <Ionicons name="bookmark" size={24} color="#3b1b0d" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push("/cart")}
          >
            <Ionicons name="cart" size={24} color="#3b1b0d" />
          </TouchableOpacity>
        </View>
      </View>

      {isSearchFocused && recentSearches.length > 0 && (
        <View style={styles.recentDropdown}>
          {recentSearches
            .filter((term) =>
              term.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((term, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  setSearchQuery(term);
                  setIsSearchFocused(false);
                }}
                style={styles.recentItem}
              >
                <Text style={styles.recentText}>{term}</Text>
              </TouchableOpacity>
            ))}

          <TouchableOpacity
            onPress={handleClearRecentSearches}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
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

        <View style={styles.recommendedGrid}>
          {filteredItems.map((item) => (
            <View key={item.id} style={styles.recommendedItem}>
              <View style={styles.recommendedImageContainer}>
                <Image
                  source={
                    typeof item.image === "string"
                      ? { uri: item.image }
                      : item.image
                  }
                  style={styles.recommendedImage}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.countRow}>
                  <Text style={styles.countTextSmall}>{item.count}</Text>
                </View>

                {item.category === "User" && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: "/edit-item",
                        params: {
                          id: item.id,
                          name: item.name,
                          image:
                            typeof item.image === "string" ? item.image : "",
                        },
                      })
                    }
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
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
  closeIcon: {
    width: 15,
    height: 15,
    marginLeft: 8,
    tintColor: "#323335ff",
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
  recommendedImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
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
  editButton: {
    marginTop: 6,
    paddingVertical: 6,
    backgroundColor: "#f97316",
    borderRadius: 6,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
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
  justifyContent: "space-evenly",
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
  recentDropdown: {
    position: "absolute",
    top: 110,
    left: 100,
    right: 100,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
    maxHeight: 150,
  },
  recentItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  recentText: {
    fontSize: 14,
    color: "#000",
  },
  clearButton: {
    paddingVertical: 10,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  clearButtonText: {
    color: "#f97316",
    fontWeight: "600",
    fontSize: 14,
  },
});