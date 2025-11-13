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

// Preset images
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
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const presetItems: Item[] = [
    { id: 1, name: "USBC Charger", count: 254, image: charger, category: "Popular" },
    { id: 2, name: "Core 100 Book", count: 243, image: corebook, category: "Books" },
    { id: 3, name: "Chair", count: 180, image: chair, category: "Home" },
    { id: 4, name: "Tools", count: 156, image: tools, category: "Tools" },
    { id: 5, name: "Tractor", count: 180, image: tractor, category: "Tools" },
    { id: 6, name: "Vacuum", count: 156, image: vacuum, category: "Home" },
  ];

  const results = presetItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Search</Text>

      {/* SEARCH BAR */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#6b7280" style={{ marginRight: 6 }} />
        <TextInput
          placeholder="Search for items"
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* RESULTS */}
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.grid}>
          {results.length > 0 ? (
            results.map((item) => (
              <View key={item.id} style={styles.card}>
                <Image source={item.image} style={styles.cardImage} />
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.cardCount}>{item.count} neighbors</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noResults}>No results found</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingBottom: 50,
  },
  card: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 140,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    padding: 10,
    paddingBottom: 2,
    color: "#111827",
  },
  cardCount: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    fontSize: 13,
    color: "#6b7280",
  },
  noResults: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 30,
  },
});