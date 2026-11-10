import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useBookmarks } from "../../context/BookmarksContext";
import { useDatabase } from "../../context/DatabaseContext";
import { items as itemsApi, type Item } from "../../services/supabase_api";
import ItemCard from "../components/ItemCard";
import {
  ALL_CATEGORIES,
  CATEGORY_FILTERS,
  matchesCategory,
} from "../../constants/categories";
import {
  ALL_COMMUNITIES,
  filterItemsByCommunity,
  loadCommunityFilter,
  resolveCommunityFilter,
  saveCommunityFilter,
} from "../../services/communityFilter";

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { myCommunities } = useDatabase();

  const [activeTab, setActiveTab] = useState<string>(ALL_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const { byId } = useBookmarks();
  const bookmarkCount = Object.keys(byId).length;

  const searchInputRef = useRef<TextInput | null>(null);

  // The saved or picked community. It is checked against myCommunities on
  // every render, so a community the user has left shows as "All".
  const [communityChoice, setCommunityChoice] = useState<string>(ALL_COMMUNITIES);
  const [communityPickerOpen, setCommunityPickerOpen] = useState(false);
  const pickedCommunity = useRef(false);
  const selectedCommunity = resolveCommunityFilter(communityChoice, myCommunities);

  const communityNames = useMemo(() => {
    const names: Record<string, string> = {};
    myCommunities.forEach((c) => {
      names[c.id] = c.name;
    });
    return names;
  }, [myCommunities]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadCommunityFilter(userId).then((saved) => {
      // Don't overwrite a pick the user made while this was loading.
      if (cancelled || pickedCommunity.current || !saved) return;
      setCommunityChoice(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const pickCommunity = (communityId: string) => {
    pickedCommunity.current = true;
    setCommunityChoice(communityId);
    setCommunityPickerOpen(false);
    if (userId) void saveCommunityFilter(userId, communityId);
  };

  // Load items from API
  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await itemsApi.getAll();
      if (error) throw error;
      setItems(data ?? []);
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadItems();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadItems]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  const filteredItems = filterItemsByCommunity(items, selectedCommunity).filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q);

    return matchesCategory(item, activeTab) && matchesSearch;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading items...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)")}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logoImage}
          />
        </TouchableOpacity>

        <View style={styles.searchBar}>
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
            onChangeText={setSearchQuery}
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
                  {bookmarkCount > 99 ? "99+" : bookmarkCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* COMMUNITY FILTER */}
      <View style={styles.communityBar}>
        <TouchableOpacity
          style={styles.communityDropdown}
          onPress={() => setCommunityPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Choose community"
          activeOpacity={0.8}
        >
          <Ionicons name="people" size={16} color="#3b1b0d" />
          <Text style={styles.communityDropdownText} numberOfLines={1}>
            {selectedCommunity === ALL_COMMUNITIES
              ? "All communities"
              : communityNames[selectedCommunity]}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#3b1b0d" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={communityPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCommunityPickerOpen(false)}
      >
        <Pressable
          style={styles.pickerBackdrop}
          onPress={() => setCommunityPickerOpen(false)}
        >
          <View style={styles.pickerCard}>
            {[
              { id: ALL_COMMUNITIES, name: "All communities" },
              ...myCommunities,
            ].map((c) => {
              const selected = c.id === selectedCommunity;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.pickerOption}
                  onPress={() => pickCommunity(c.id)}
                  accessibilityRole="button"
                  accessibilityLabel={c.name}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      selected && styles.pickerOptionTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {c.name}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color="#f97316" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* MAIN CONTENT */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* TABS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollContainer}
        >
          {CATEGORY_FILTERS.map((tab) => (
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
                {tab === ALL_CATEGORIES ? "Popular" : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ITEMS GRID */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#9ca3af" />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? "Try a different search"
                : "Check back later for new items"}
            </Text>
          </View>
        ) : (
          <View style={styles.recommendedGrid}>
            {filteredItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                showCommunity={selectedCommunity === ALL_COMMUNITIES}
                communityName={communityNames[item.community_id]}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: "600",
    color: "#4b5563",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#9ca3af",
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
    letterSpacing: 0,
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
  tabScrollContainer: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tabScrollContent: {
    paddingHorizontal: 8,
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
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
  scrollView: {
    flex: 1,
  },
  recommendedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 12,
    rowGap: 12,
  },
  communityBar: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  communityDropdown: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    maxWidth: "100%",
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  communityDropdownText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#3b1b0d",
  },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 24,
  },
  pickerCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  pickerOptionText: {
    flexShrink: 1,
    fontSize: 15,
    color: "#111827",
  },
  pickerOptionTextSelected: {
    color: "#f97316",
    fontWeight: "600",
  },
});
