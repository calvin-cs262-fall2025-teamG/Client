/**
 * Item Detail Screen
 * 
 * FILE NAME: [id].tsx
 * The brackets [id] indicate this is a dynamic route in Expo Router.
 * When a user navigates to /item/5, this component receives id=5 as a parameter.
 * 
 * NAVIGATION:
 * - Accessed from: index.tsx (home feed), search.tsx, bookmark.tsx
 * - Route pattern: /item/:id (where :id is the item_id from the database)
 * - Example: router.push(`/item/3`) opens this screen with item_id=3
 * 
 * FUNCTIONALITY:
 * - Fetches item details from database via getItemById(id)
 * - Displays item image, name, status (borrowed/available), and owner info
 * - Shows owner's profile picture, name, and rating
 * - Provides "Borrow Now" button for available items
 * - Provides "Notify Me" button for borrowed items
 * - Allows chatting with the owner via chat button
 * 
 * DATA FLOW:
 * 1. Component receives numeric ID from route params
 * 2. Calls getItemById() to fetch item from database (mock or Azure)
 * 3. Calls getAllUsers() to get owner information
 * 4. Renders item details with owner profile
 * 5. Handles borrow requests and notifications via AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getAllUsers, getItemById } from "../../lib/api";

/**
 * ItemDetails type definition
 * Represents the structured data for displaying an item and its owner
 */
type ItemDetails = {
  name: string;
  status: "borrowed" | "none";
  image: any; // Can be local require() or { uri: string }
  count: number; // Bookmark/interest count (currently unused)
  lister: {
    name: string;
    avatar: any; // Owner's profile picture as { uri: string }
    rating: number; // Owner's rating (1.0 - 5.0)
  };
};

// AsyncStorage key for storing notification preferences
const NOTIFY_KEY = "heyneighbor:notifyMe";

/**
 * ItemDetailScreen Component
 * 
 * Main component that displays detailed information about a single item.
 * Automatically fetches item data from the database when mounted.
 */
export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams(); // Get the item ID from the URL
  const router = useRouter();

  // Convert id parameter to number (handles string or string[] from router)
  const numericId = Array.isArray(id) ? Number(id[0]) : Number(id);

  // Component state
  const [loading, setLoading] = useState(true); // Loading state for API call
  const [item, setItem] = useState<ItemDetails | null>(null); // Item data from database
  const [isNotified, setIsNotified] = useState(false); // Whether user subscribed to notifications

  /**
   * Load item data from database on mount
   * Fetches item details and owner information via API
   */
  useEffect(() => {
    const loadItem = async () => {
      try {
        const dbItem = await getItemById(numericId);
        if (dbItem) {
          const users = await getAllUsers();
          const owner = users.find((u) => u.user_id === dbItem.owner_id);
          
          setItem({
            name: dbItem.name,
            status: dbItem.request_status === "borrowed" ? "borrowed" : "none",
            image: dbItem.image_url ? { uri: dbItem.image_url } : undefined,
            count: 0,
            lister: {
              name: owner?.name || "Unknown",
              avatar: owner?.profile_picture ? { uri: owner.profile_picture } : undefined,
              rating: 4.5,
            },
          });
        }
      } catch (error) {
        console.error("Failed to load item:", error);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [numericId]);

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: "#f9fafb" }]}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  // Show error if item not found or invalid ID
  if (!item || Number.isNaN(numericId)) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 18 }}>Item not found.</Text>
      </View>
    );
  }

  // Derive current availability status
  const status: "borrowed" | "none" = item.status ?? "none";

  /**
   * Check if user previously subscribed to notifications for this item
   * Runs on mount and when item ID changes
   */
  useEffect(() => {
    const checkInitialNotify = async () => {
      const raw = await AsyncStorage.getItem(NOTIFY_KEY);
      if (!raw) return;

      const ids: number[] = JSON.parse(raw);
      if (ids.includes(numericId)) {
        setIsNotified(true);
      }
    };

    checkInitialNotify();
  }, [numericId]);

  /**
   * Show notification alert when a borrowed item becomes available
   * Automatically removes item from notification list after showing alert
   */
  useEffect(() => {
    const checkNotify = async () => {
      try {
        const raw = await AsyncStorage.getItem(NOTIFY_KEY);
        if (!raw) return;

        const ids: number[] = JSON.parse(raw);

        if (ids.includes(numericId) && status === "none") {
          Alert.alert("Good news!", `${item.name} is now available to borrow.`);

          const filtered = ids.filter((x) => x !== numericId);
          await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(filtered));
          setIsNotified(false);
        }
      } catch (err) {
        console.log("Error checking notify list:", err);
      }
    };

    checkNotify();
  }, [numericId, status, item.name]);

  /**
   * Handle notification subscription toggle
   * Adds or removes item from user's notification list in AsyncStorage
   */
  const handleNotifyMe = async () => {
    try {
      const raw = await AsyncStorage.getItem(NOTIFY_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];

      if (!ids.includes(numericId)) {
        // Add subscribe
        ids.push(numericId);
        await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(ids));
        setIsNotified(true);

        Alert.alert(
          "Notification set",
          `We'll notify you when ${item.name} becomes available.`
        );
      } else {
        // Unsubscribe if clicked again
        const updated = ids.filter((x) => x !== numericId);
        await AsyncStorage.setItem(NOTIFY_KEY, JSON.stringify(updated));
        setIsNotified(false);

        Alert.alert(
          "Notification removed",
          `You will no longer be notified about ${item.name}.`
        );
      }
    } catch (err) {
      console.log("Error saving notify-me:", err);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ITEM IMAGE */}
      <Image
        source={item.image}
        style={[styles.image, status === "borrowed" && { opacity: 0.55 }]}
      />

      {/* NAME */}
      <Text style={styles.name}>{item.name}</Text>

      {/* BADGE */}
      {status === "borrowed" && (
        <View style={[styles.badge, styles.borrowed]}>
          <Text style={styles.badgeText}>BORROWED</Text>
        </View>
      )}

      {/* LISTER PROFILE */}
      <View style={styles.listerCard}>
        <Image source={item.lister.avatar} style={styles.avatar} />
        <View>
          <Text style={styles.listerName}>{item.lister.name}</Text>
          <Text style={styles.rating}>⭐ {item.lister.rating}</Text>
        </View>

        <TouchableOpacity
          style={styles.viewProfileButton}
          onPress={() =>
            router.push({
              pathname: "/chat-thread",
              params: {
                name: item.lister.name,
                avatar: item.lister.avatar,
              },
            })
          }
        >
          <Text style={styles.viewProfileText}>Chat</Text>
        </TouchableOpacity>
      </View>

      {/* ACTION BUTTONS */}
      {status === "none" ? (
        <TouchableOpacity
          style={styles.borrowButton}
          onPress={() =>
            router.push({
              pathname: "/borrow-confirmation",
              params: {
                itemName: item.name,
                listerName: item.lister.name,
                image: item.image, // optional: if you want image on confirmation
              },
            })
          }
        >
          <Text style={styles.borrowText}>Borrow Now</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.notifyButton,
            isNotified && styles.notifyButtonDisabled
          ]}
          onPress={handleNotifyMe}
        >
          <Text style={styles.notifyText}>
            {isNotified ? "Notifying you" : "Notify Me"}
          </Text>
        </TouchableOpacity>

      )}
    </ScrollView>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },

  image: {
    width: "100%",
    height: 330,
    resizeMode: "cover",
    backgroundColor: "#f3f4f6",
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  badge: {
    alignSelf: "flex-start",
    marginLeft: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  borrowed: { backgroundColor: "#ef4444" },
  badgeText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  count: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 16,
    marginTop: 6,
  },

  // --------- LISTER INFO ---------
  listerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    margin: 16,
    borderRadius: 14,
    gap: 14,
  },
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 40,
  },
  listerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  rating: {
    fontSize: 14,
    color: "#6b7280",
  },
  viewProfileButton: {
    marginLeft: "auto",
    backgroundColor: "#f97316",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  viewProfileText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },

  // --------- BUTTONS ---------
  borrowButton: {
    backgroundColor: "#438732ff",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  borrowText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  notifyButton: {
    backgroundColor: "#f97316",
    padding: 16,
    margin: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  notifyText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  notifyButtonDisabled: {
    opacity: 0.6,
  }
});
