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
import {
  getBookmarkCount,
  updateBookmarkCount,
} from "../../services/bookmarkCount";
import {
  ALL_COMMUNITIES,
  filterItemsByCommunity,
  loadCommunityFilter,
  resolveCommunityFilter,
  saveCommunityFilter,
} from "../../services/communityFilter";

const imageMap: Record<string, any> = {
  "banner.png": require("../../assets/images/banner.png"),
  "bike.jpg": require("../../assets/images/bike.jpg"),
  "campingtent.jpg": require("../../assets/images/campingtent.jpg"),
  "chair.jpg": require("../../assets/images/chair.jpg"),
  "charger.jpg": require("../../assets/images/charger.jpg"),
  "cookbook.jpg": require("../../assets/images/cookbook.jpg"),
  "cookset.jpg": require("../../assets/images/cookset.jpg"),
  "corebook.jpg": require("../../assets/images/corebook.jpg"),
  "desklamp.jpeg": require("../../assets/images/desklamp.jpeg"),
  "drill.jpg": require("../../assets/images/drill.jpg"),
  "electrickettle.jpg": require("../../assets/images/electrickettle.jpg"),
  "hose.jpg": require("../../assets/images/hose.jpg"),
  "keurig.png": require("../../assets/images/keurig.png"),
  "laptopstand.jpg": require("../../assets/images/laptopstand.jpg"),
  "pressurewasher.jpg": require("../../assets/images/pressurewasher.jpg"),
  "smartwatch.jpg": require("../../assets/images/smartwatch.jpg"),
  "speaker.jpg": require("../../assets/images/speaker.jpg"),
  "standingdesk.jpg": require("../../assets/images/standingdesk.jpg"),
  "tools.jpg": require("../../assets/images/tools.jpg"),
  "tractor.jpg": require("../../assets/images/tractor.jpg"),
  "vacuum.jpg": require("../../assets/images/vacuum.jpg"),
  "vacuum2.jpg": require("../../assets/images/vacuum2.jpg"),
  "vacuum3.jpg": require("../../assets/images/vacuum3.jpg"),
  "vacuum4.jpg": require("../../assets/images/vacuum4.jpg"),
  "vacuum5.jpg": require("../../assets/images/vacuum5.jpg"),
  "vacuum6.jpg": require("../../assets/images/vacuum6.jpg"),
  "wirelessbuds.jpg": require("../../assets/images/wirelessbuds.jpg"),
  "yogamat.jpg": require("../../assets/images/yogamat.jpg"),
};

export default function Index() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;
  const { myCommunities } = useDatabase();

  const [activeTab, setActiveTab] = useState("Popular");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkCounts, setBookmarkCounts] = useState<Record<string, number>>(
    {},
  );

  const { byId, isSaved, toggle } = useBookmarks();
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

  // Load bookmark counts for all items
  const loadBookmarkCounts = useCallback(async (itemsList: Item[]) => {
    const counts: Record<string, number> = {};

    await Promise.all(
      itemsList.map(async (item) => {
        counts[item.id] = await getBookmarkCount(item.id);
      }),
    );

    setBookmarkCounts(counts);
  }, []);

  // Load items from API
  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await itemsApi.getAll();
      if (error) throw error;
      const list = data ?? [];
      setItems(list);
      await loadBookmarkCounts(list);
    } catch (error) {
      console.error("Failed to load items:", error);
    } finally {
      setLoading(false);
    }
  }, [loadBookmarkCounts]);

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

  const handleBookmarkToggle = async (item: Item) => {
    const wasBookmarked = isSaved(item.id);

    toggle({
      id: item.id,
      title: item.name,
      image_path: item.image_path ?? null,
      count: 0,
      status: item.status === "borrowed" ? "borrowed" : "none",
      category: item.category || "Other",
    });

    const currentCount = bookmarkCounts[item.id] || 0;
    const newCount = await updateBookmarkCount(
      item.id,
      wasBookmarked,
      currentCount,
    );

    setBookmarkCounts((prev) => ({
      ...prev,
      [item.id]: newCount,
    }));
  };

  const filteredItems = filterItemsByCommunity(items, selectedCommunity).filter((item) => {
    const matchesCategory =
      activeTab === "Popular" ||
      (item.category &&
        item.category.toLowerCase().startsWith(activeTab.toLowerCase()));

    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      item.name.toLowerCase().includes(q) ||
      (item.description ?? "").toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const categories = [
    "Popular",
    "Home",
    "Books",
    "Tools",
    "Outdoor",
    "School",
    "Electronics",
    "Kitchen",
  ];

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
          {categories.map((tab) => (
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
            {filteredItems.map((item) => {
              const isBookmarked = isSaved(item.id);
              const isBorrowed = item.status === "borrowed";

              return (
                <View key={item.id} style={styles.recommendedItem}>
                  {/* IMAGE + BOOKMARK */}
                  <View style={styles.recommendedImageContainer}>
                    {/* Edit icon for own items, bookmark for others */}
                    {item.owner_id === user?.id ? (
                      <TouchableOpacity
                        style={styles.editIconContainer}
                        onPress={() =>
                          router.push({
                            pathname: "/edit-item",
                            params: { id: item.id },
                          })
                        }
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="pencil" size={16} color="#fff" />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.bookmarkIconContainer}
                        onPress={() => handleBookmarkToggle(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={isBookmarked ? "bookmark" : "bookmark-outline"}
                          size={22}
                          color="#3b1b0d"
                        />
                      </TouchableOpacity>
                    )}
                    {/* Navigate via image */}
                    <TouchableOpacity
                      onPress={() => {
                        if (item.owner_id === user?.id) {
                          router.push({
                            pathname: "/edit-item",
                            params: { id: item.id },
                          });
                        } else {
                          router.push(`/item/${item.id}`);
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      {item.image_path ? (
                        imageMap[item.image_path] ? (
                          <Image
                            source={imageMap[item.image_path]}
                            style={[
                              styles.recommendedImage,
                              isBorrowed && { opacity: 0.55 },
                            ]}
                          />
                        ) : item.image_path.startsWith("http") ? (
                          <Image
                            source={{ uri: item.image_path }}
                            style={[
                              styles.recommendedImage,
                              isBorrowed && { opacity: 0.55 },
                            ]}
                          />
                        ) : (
                          <View
                            style={[
                              styles.recommendedImage,
                              styles.placeholderImage,
                            ]}
                          >
                            <Ionicons
                              name="image-outline"
                              size={40}
                              color="#9ca3af"
                            />
                          </View>
                        )
                      ) : (
                        <View
                          style={[
                            styles.recommendedImage,
                            styles.placeholderImage,
                          ]}
                        >
                          <Ionicons
                            name="image-outline"
                            size={40}
                            color="#9ca3af"
                          />
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Borrowed badge */}
                    {isBorrowed && (
                      <View style={[styles.statusBadge, styles.statusBorrowed]}>
                        <Text style={styles.statusText}>Borrowed</Text>
                      </View>
                    )}
                  </View>

                  {/* Navigate via info section */}
                  <TouchableOpacity
                    onPress={() => router.push(`/item/${item.id}`)}
                    activeOpacity={0.8}
                    style={styles.recommendedInfo}
                  >
                    <Text
                      style={[
                        styles.recommendedName,
                        isBorrowed && { opacity: 0.7 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    {selectedCommunity === ALL_COMMUNITIES &&
                      communityNames[item.community_id] && (
                        <View style={styles.communityLabel}>
                          <Text
                            style={styles.communityLabelText}
                            numberOfLines={1}
                          >
                            {communityNames[item.community_id]}
                          </Text>
                        </View>
                      )}
                  </TouchableOpacity>
                </View>
              );
            })}
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
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
  },
  recommendedInfo: {
    padding: 12,
  },
  recommendedName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 6,
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
    backgroundColor: "#f73e3eaf",
  },
  bookmarkIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.85)",
    padding: 6,
    borderRadius: 20,
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
  communityLabel: {
    alignSelf: "flex-start",
    backgroundColor: "#fff7ed",
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  communityLabelText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#c2410c",
  },
  editIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 20,
    backgroundColor: "#f97316",
    padding: 8,
    borderRadius: 20,
  },
});
