import React, { useEffect, useState } from "react";
import { RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const roseImage = require("../../assets/images/rose.png");

interface Item {
  id: number;
  name: string;
  count: number;
  image: any;
  category: string;
}

export default function Profile() {
  const [listings, setListings] = useState<Item[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadItems = async () => {
    const stored = await AsyncStorage.getItem("userItems");
    if (stored) {
      const parsed = JSON.parse(stored);

      const fixed = parsed.map((item: any) => ({
        ...item,
        count: item.count ?? 0,
      }));

      setListings(fixed);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadItems = async () => {
      const stored = await AsyncStorage.getItem("userItems");
      if (stored) {
        const parsed = JSON.parse(stored);

        const fixed = parsed.map((item: any) => ({
          ...item,
          count: item.count ?? 0,
        }));

        setListings(fixed);
      }

    };
    loadItems();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top profile header */}
      <View style={styles.profileTop}>
        <Image source={roseImage} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>Rose Campbell</Text>
          <Text style={styles.neighborsCount}>152 Neighbors</Text>
        </View>
      </View>

      <Text style={[styles.sectionHeaderText, { marginTop: 12, marginLeft: 12 }]}>
        Your Listings
      </Text>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.recommendedGrid}>
          {listings.map((item) => (
            <View key={item.id} style={styles.recommendedItem}>
              <View style={styles.recommendedImageContainer}>
                <Image
                  source={typeof item.image === "string" ? { uri: item.image } : item.image}
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
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() =>
                  router.push({
                    pathname: "/edit-item",
                    params: {
                      id: item.id,
                      name: item.name,
                      image: typeof item.image === "string" ? item.image : "",
                    },
                  })
                }
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
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

});
