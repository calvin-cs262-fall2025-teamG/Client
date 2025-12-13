import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { items as itemsApi, users as usersApi } from "../../services/api";
import type { User } from "../../services/authServices";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type ApiItem = {
  item_id: number;
  name: string;
  description?: string;
  image_url?: string | null;
  category?: string | null;
  owner_id: number;
};

type ItemCard = {
  id: number;
  name: string;
  count: number;
  image: string | null;
  category: string;
};

export default function Profile() {
  const [listings, setListings] = useState<ItemCard[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const { logout, user } = useAuth();
  const router = useRouter();
  const [fullUser, setFullUser] = useState<User | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const clearOldHardcodedItems = async () => {
    await AsyncStorage.removeItem("userItems");
  };

  const loadProfileUser = async () => {
    if (!user) return;
    console.log("📥 Loading profile for user:", user.user_id);
    const u = await usersApi.getById(user.user_id);
    console.log("✅ Loaded user:", u);
    setFullUser(u as User);
  };

  const loadMyItems = async () => {
    if (!user) {
      setListings([]);
      return;
    }
    const all = (await itemsApi.getAll()) as ApiItem[];
    const mine = all.filter((it) => it.owner_id === user.user_id);

    setListings(
      mine.map((it) => ({
        id: it.item_id,
        name: it.name,
        count: 0,
        image: it.image_url ?? null,
        category: it.category ?? "",
      }))
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfileUser(), loadMyItems()]);
    setRefreshing(false);
  };

  useEffect(() => {
    clearOldHardcodedItems().catch(console.error);
    loadProfileUser().catch(console.error);
    loadMyItems().catch(console.error);
  }, [user?.user_id]);

  useFocusEffect(
    useCallback(() => {
      loadProfileUser();
      loadMyItems();
    }, [user?.user_id])
  );

  const displayName = fullUser?.name ?? user?.name ?? "New User";
const avatarUrl = fullUser?.profile_picture ?? user?.profile_picture ?? null;

  // placeholder until you build real neighbor logic
  const neighborsCount = 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerWrap}>
        {/* top-right logout icon */}
        <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={34} color="#2b2725ff" />
        </TouchableOpacity>

        {/* Row 1: avatar + name */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push("/edit-profile")}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <Ionicons name="person" size={34} color="#9ca3af" />
                <Text style={styles.addPhotoText}>Add</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={2}>
              {displayName}
            </Text>
            <Text style={styles.neighborsText}>{neighborsCount} Neighbors</Text>
          </View>
        </View>

        {/* Row 2: actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => router.push("/edit-profile")}
            activeOpacity={0.9}
          >
            <Text style={styles.editProfileText} numberOfLines={1}>
              Edit profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallPlusButton}
            onPress={() => router.push("/(tabs)/list")}
            activeOpacity={0.9}
          >
            <Ionicons name="add" size={22} color="#111827" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionHeaderText}>Your Listings</Text>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.recommendedGrid}>
          {/* Create New card */}
          <TouchableOpacity
            style={[styles.recommendedItem, styles.createItemCard]}
            onPress={() => router.push("/(tabs)/list")}
            activeOpacity={0.9}
          >
            <View style={styles.createItemInner}>
              <View style={styles.createCircle}>
                <Ionicons name="add" size={45} color="#ffffff" />
              </View>
              <Text style={styles.createItemText}>Create New</Text>
            </View>
          </TouchableOpacity>

          {/* Empty state tile */}
          {listings.length === 0 ? (
            <View style={[styles.recommendedItem, styles.emptyCard]}>
              <Ionicons name="pricetag-outline" size={26} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No listings yet</Text>
            </View>
          ) : (
            listings.map((item) => (
              <View key={item.id} style={styles.recommendedItem}>
                <View style={styles.recommendedImageContainer}>
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.recommendedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImageBox}>
                      <Ionicons
                        name="image-outline"
                        size={28}
                        color="#9ca3af"
                      />
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.editFloatingButton}
                    onPress={() =>
                      router.push({
                        pathname: "/edit-item",
                        params: { id: item.id.toString() },
                      })
                    }
                    activeOpacity={0.9}
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
            ))
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scrollView: { flex: 1 },

  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 10,
    backgroundColor: "#f9fafb",
    position: "relative",
  },

  // ✅ bigger tap target + slightly more balanced placement
  logoutIcon: {
    position: "absolute",
    right: 12,
    top: 18,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingRight: 56, // ✅ give more space so the icon never feels cramped
  },

  profileImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#e5e7eb",
  },

  profilePlaceholder: { justifyContent: "center", alignItems: "center" },

  addPhotoText: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#9ca3af",
  },

  nameBlock: { flex: 1, minWidth: 0 },

  // ✅ slightly smaller + less tall so it feels more “real”
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 26,
  },

  neighborsText: {
    marginTop: 6,
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },

  actionsRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  editProfileButton: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  editProfileText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },

  smallPlusButton: {
    width: 56,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ smaller section label
  sectionHeaderText: {
    color: "#4b5563",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 10,
    marginLeft: 16,
  },

  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
    gap: 12,
  },

  recommendedItem: {
    width: "47%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
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

  recommendedImage: { width: "100%", height: "100%" },

  noImageBox: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  editFloatingButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#f97316",
    width: 36,
    height: 36,
    borderRadius: 18,
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
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
    color: "#111827",
  },

  countRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },

  createItemCard: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 26,
  },

  createItemInner: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 8,
  },

  createCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f97316",
    alignItems: "center",
    justifyContent: "center",
  },

  createItemText: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "800",
    color: "#f97316",
    textAlign: "center",
  },

  emptyCard: {
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    minHeight: 190,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
});
