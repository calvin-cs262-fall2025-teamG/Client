import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

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
  const { user, logout, sendCode } = useAuth();

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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Logout",
          onPress: async () => {
            await logout();
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRequestNewCode = async () => {
    if (!user?.email) return;
    try {
      await sendCode(user.email);
      Alert.alert("Success", "A new verification code has been sent to your email");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to send code"
      );
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top profile header */}
      <View style={styles.profileTop}>
        <Image source={roseImage} style={styles.profileImage} />
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name || "User"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.neighborsCount}>152 Neighbors</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.sectionHeaderText, { marginTop: 12, marginLeft: 12 }]}
      >
        Your Listings
      </Text>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.recommendedGrid}>
          <TouchableOpacity
            style={[styles.recommendedItem, styles.createItemCard]}
            onPress={() => router.push("../(tabs)/list")}
          >
            <View style={styles.createItemInner}>
              <Ionicons name="add-circle" size={40} color="#f97316" />
              <Text style={styles.createItemText}>Create New</Text>
            </View>
          </TouchableOpacity>

          {listings.map((item) => (
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

                <TouchableOpacity
                  style={styles.editFloatingButton}
                  onPress={() =>
                    router.push({
                      pathname: "../edit-item",
                      params: {
                        id: item.id.toString(),
                        name: item.name,
                        image: typeof item.image === "string" ? item.image : "",
                      },
                    })
                  }
                >
                  <Ionicons name="pencil" size={16} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.recommendedInfo}>
                <Text style={styles.recommendedName} numberOfLines={1}>
                  {item.name}
                </Text>

                <View style={styles.countRow}>
                  <Ionicons
                    name="bookmark"
                    size={14}
                    color="#3b1b0d"
                    style={{ marginRight: 4 }}
                  />
                  <Text>{item.count}</Text>
                </View>
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
    padding: 12,
    backgroundColor: "#f9fafb",
  },

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
    padding: 10,
    gap: 12,
  },

  recommendedItem: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  recommendedImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e5e7eb",
    position: "relative",
  },

  recommendedImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  /* ⭐ EDIT BUTTON — TOP RIGHT */
  editFloatingButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#f97316",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },

  recommendedInfo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  recommendedName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
    color: "#111827",
  },

  countTextSmall: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
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

  email: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },

  settingsButton: {
    padding: 8,
    marginLeft: "auto",
  },
  createItemCard: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  createItemInner: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },

  createItemText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#f97316",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
});
