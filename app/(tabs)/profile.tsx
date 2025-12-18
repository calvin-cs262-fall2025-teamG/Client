import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { items as itemsApi, users as usersApi } from "../../services/api";
import type { User } from "../../services/authServices";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import BookmarkButton from "../components/BookmarkButton";

type ApiItem = {
  item_id: number;
  name: string;
  description?: string;
  image_url?: string | null;
  category?: string | null;
  owner_id: number;
  request_status?: string;
};

type ItemCard = {
  id: number;
  name: string;
  count: number;
  image: string | null;
  category: string;
  status: string;
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
    console.log("Loading profile for user:", user.user_id);
    const u = await usersApi.getById(user.user_id);
    console.log("Loaded user:", u);
    setFullUser(u as User);
  };

  const loadMyItems = async () => {
    if (!user) {
      setListings([]);
      return;
    }

    console.log("🔄 Loading items for user:", user.user_id);
    const all = (await itemsApi.getAll()) as ApiItem[];
    const mine = all.filter((it) => it.owner_id === user.user_id);

    // Load bookmark counts for each item
    const itemsWithCounts = await Promise.all(
      mine.map(async (it) => {
        let bookmarkCount = 0;
        try {
          const stored = await AsyncStorage.getItem(`bookmark-count:${user.user_id}:${it.item_id}`);
          bookmarkCount = stored ? parseInt(stored) : 0;
          console.log(`Item ${it.item_id} (${it.name}): ${bookmarkCount} bookmarks`);
        } catch (err) {
          console.error(` Error loading bookmark count for item ${it.item_id}:`, err);
        }

        return {
          id: it.item_id,
          name: it.name,
          count: bookmarkCount,
          image: it.image_url ?? null,
          category: it.category ?? "",
          status: it.request_status ?? "available",
        };
      })
    );

    console.log("✅ Loaded items with counts:", itemsWithCounts);
    console.log("🔍 check direct key", await AsyncStorage.getItem("bookmark-count:5"));
    console.log("🔍 all bookmark keys", (await AsyncStorage.getAllKeys()).filter(k => k.startsWith("bookmark-count:")));

    setListings(itemsWithCounts);
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

  // Reload items every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("🎯 Profile screen focused, reloading items...");
      loadProfileUser();
      loadMyItems();
    }, [user?.user_id])
  );

  const displayName = fullUser?.name ?? user?.name ?? "New User";
  const avatarUrl = fullUser?.profile_picture ?? user?.profile_picture ?? null;

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
            style={styles.smallHelpButton}
            onPress={() => router.push("/HelpList")}
            activeOpacity={0.9}
          >
            <Ionicons name="help-circle-outline" size={22} color="#111827" />
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
            listings.map((item) => {
              const isBorrowed = item.status !== "available";

              return (
                <View key={item.id} style={styles.recommendedItem}>
                  <View style={styles.recommendedImageContainer}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={[
                          styles.recommendedImage,
                          isBorrowed && { opacity: 0.55 }
                        ]}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[
                        styles.noImageBox,
                        isBorrowed && { opacity: 0.55 }
                      ]}>
                        <Ionicons
                          name="image-outline"
                          size={28}
                          color="#9ca3af"
                        />
                      </View>
                    )}

                    {/* Borrowed Badge */}
                    {isBorrowed && (
                      <View style={styles.borrowedBadge}>
                        <Text style={styles.borrowedText}>Borrowed</Text>
                      </View>
                    )}

                    {/* Edit Button */}
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
                    <Text
                      style={[
                        styles.recommendedName,
                        isBorrowed && { opacity: 0.7 }
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <View style={styles.countRow}>
                      <BookmarkButton
                        item={{ id: String(item.id), title: item.name }}
                        size={16}
                        showCount={true}
                      />
                    </View>

                  </View>
                </View>
              );
            })
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
    paddingRight: 56,
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

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 26,
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

  smallHelpButton: {
    width: 56,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },

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

  // Borrowed badge styles
  borrowedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#f87171",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  borrowedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
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

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },

  countNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b1b0d",
  },

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