import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  //TouchableOpacity,
  SafeAreaView,
  //TextInput,
} from "react-native";
//import { Ionicons } from "@expo/vector-icons";

const roseImage = require("../../assets/images/rose.png");

interface Item {
  id: number;
  name: string;
  count: number;
  image: any;
  category: string;
}

const listings: Item[] = [
  { id: 1, name: "Basketball", count: 5, image: roseImage, category: "User" },
  {
    id: 2,
    name: "Laptop Charger",
    count: 2,
    image: roseImage,
    category: "User",
  },
  {
    id: 3,
    name: "Textbook: Calculus",
    count: 10,
    image: roseImage,
    category: "User",
  },
];

export default function Profile() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Top Header: Profile Picture, Name, Neighbors */}
      <View style={styles.profileTop}>
        <Image source={roseImage} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Rose Campbell</Text>
          <Text style={styles.neighborsCount}>152 Neighbors</Text>
        </View>
      </View>

      {/* Listings Label */}
      <Text
        style={[styles.sectionHeaderText, { marginTop: 12, marginLeft: 12 }]}
      >
        Your Listings
      </Text>

      {/* Listings Grid */}
      <ScrollView style={styles.scrollView}>
        <View style={styles.recommendedGrid}>
          {listings.map((item) => (
            <View key={item.id} style={styles.recommendedItem}>
              <View style={styles.recommendedImageContainer}>
                <Image
                  source={item.image}
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
                {/* Optional: You can add edit button or other controls here */}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeaderText: {
    color: "#4b5563",
    fontSize: 18,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
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
    borderRadius: 8,
  },
  recommendedInfo: {
    padding: 12,
  },
  recommendedName: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#111827",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countTextSmall: {
    fontSize: 12,
    color: "#4b5563",
  },
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#f9fafb",
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 35,
    paddingLeft: 16,
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5e7eb",
  },
  profileInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  neighborsCount: {
    marginTop: 4,
    fontSize: 16,
    color: "#6b7280",
  },
});
