import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  communities as communitiesApi,
  items as itemsApi,
  type Community,
  type Item,
} from "../../services/supabase_api";
import { Ionicons } from "@expo/vector-icons";
import { useDatabase } from "../../context/DatabaseContext";
import {
  ALL_COMMUNITIES,
  filterItemsByCommunity,
} from "../../services/communityFilter";
import ItemCard from "../components/ItemCard";
import {
  ALL_CATEGORIES,
  CATEGORY_FILTERS,
  matchesCategory,
} from "../../constants/categories";

const banner = require("../../assets/images/banner.png");

// avatar_path is only shown when it is already a full URL.
const avatarUri = (path: string | null) =>
  path && /^https?:\/\//i.test(path) ? path : null;

type SearchTab = "Items" | "Communities";

export default function DiscoverScreen() {
  const { myCommunities, requestToJoin } = useDatabase();

  const [activeTab, setActiveTab] = useState<SearchTab>("Items");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(ALL_COMMUNITIES);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communityQuery, setCommunityQuery] = useState("");
  // There is no server function that lists the user's pending join requests,
  // so "Requested" only lasts while this screen is mounted.
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [joining, setJoining] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const { data, error } = await itemsApi.getAll();
      if (error) throw error;
      setItems(data ?? []);
    } catch (e) {
      console.error("Failed to load items:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCommunities = useCallback(async () => {
    try {
      const { data, error } = await communitiesApi.getAll();
      if (error) throw error;
      setAllCommunities(data ?? []);
    } catch (e) {
      console.error("Failed to load communities:", e);
      setAllCommunities([]);
    } finally {
      setCommunitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadItems();
      void loadCommunities();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadItems, loadCommunities]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadItems(), loadCommunities()]);
    setRefreshing(false);
  };

  const handleRequestToJoin = async (community: Community) => {
    setJoining(community.id);
    try {
      await requestToJoin(community.id);
      setRequested((prev) => new Set(prev).add(community.id));
    } catch (e) {
      Alert.alert(
        "Couldn't send request",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setJoining(null);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return filterItemsByCommunity(items, activeCommunity).filter((it) => {
      const matchesSearch = !q || it.name.toLowerCase().includes(q);

      const matchesAvailability = !availableOnly || it.status === "available";

      return (
        matchesCategory(it, activeCategory) &&
        matchesSearch &&
        matchesAvailability
      );
    });
  }, [items, searchQuery, activeCategory, activeCommunity, availableOnly]);

  // Communities the user can ask to join: everything they aren't an active member of.
  const joinableCommunities = useMemo(() => {
    const mine = new Set(myCommunities.map((c) => c.id));
    const q = communityQuery.trim().toLowerCase();
    return allCommunities.filter(
      (c) =>
        !mine.has(c.id) &&
        (!q ||
          c.name.toLowerCase().includes(q) ||
          (c.description ?? "").toLowerCase().includes(q)),
    );
  }, [allCommunities, myCommunities, communityQuery]);

  const communityChips = [
    { id: ALL_COMMUNITIES, name: "All communities" },
    ...myCommunities,
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* ITEMS | COMMUNITIES */}
      <View style={styles.segment} accessibilityRole="tablist">
        {(["Items", "Communities"] as SearchTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segmentTab,
              activeTab === tab && styles.segmentTabActive,
            ]}
            onPress={() => setActiveTab(tab)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === tab && styles.segmentTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "Items" ? (
          <>
            {/* SEARCH BAR */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for anything"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* BANNER */}
            <View style={styles.bannerContainer}>
              <Image source={banner} style={styles.bannerImage} />
            </View>

            {/* CATEGORY TABS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabs}
            >
              {CATEGORY_FILTERS.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.tab, activeCategory === cat && styles.activeTab]}
                  onPress={() => {
                    setActiveCategory(cat);
                    setSearchQuery("");
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeCategory === cat }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeCategory === cat && styles.activeTabText,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* COMMUNITY + AVAILABILITY FILTERS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  availableOnly && styles.filterChipActive,
                ]}
                onPress={() => setAvailableOnly((v) => !v)}
                accessibilityRole="checkbox"
                accessibilityLabel="Available only"
                accessibilityState={{ checked: availableOnly }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={availableOnly ? "checkmark-circle" : "ellipse-outline"}
                  size={16}
                  color={availableOnly ? "#f97316" : "#3b1b0d"}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    availableOnly && styles.filterChipTextActive,
                  ]}
                >
                  Available only
                </Text>
              </TouchableOpacity>

              <View style={styles.filterDivider} />

              {communityChips.map((c) => {
                const selected = activeCommunity === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                    ]}
                    onPress={() => setActiveCommunity(c.id)}
                    accessibilityRole="button"
                    accessibilityLabel={c.name}
                    accessibilityState={{ selected }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ITEMS GRID */}
            {loading ? (
              <View style={{ paddingTop: 30 }}>
                <ActivityIndicator />
              </View>
            ) : filteredItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>No items found</Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredItems.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            {/* COMMUNITY SEARCH */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search communities"
                placeholderTextColor="#9ca3af"
                value={communityQuery}
                onChangeText={setCommunityQuery}
              />
            </View>

            {communitiesLoading ? (
              <View style={{ paddingTop: 30 }}>
                <ActivityIndicator />
              </View>
            ) : joinableCommunities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  {communityQuery.trim()
                    ? "No communities match your search."
                    : "No communities to join yet."}
                </Text>
              </View>
            ) : (
              <View style={styles.communityList}>
                {joinableCommunities.map((c) => {
                  const avatar = avatarUri(c.avatar_path);
                  const isRequested = requested.has(c.id);
                  const isJoining = joining === c.id;
                  return (
                    <View key={c.id} style={styles.communityCard}>
                      {avatar ? (
                        <Image
                          source={{ uri: avatar }}
                          style={styles.communityAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.communityAvatar,
                            styles.communityAvatarPlaceholder,
                          ]}
                        >
                          <Ionicons name="people" size={24} color="#fff" />
                        </View>
                      )}

                      <View style={styles.communityInfo}>
                        <Text style={styles.communityName} numberOfLines={1}>
                          {c.name}
                        </Text>
                        {!!c.description && (
                          <Text
                            style={styles.communityDescription}
                            numberOfLines={2}
                          >
                            {c.description}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          isRequested && styles.joinButtonRequested,
                        ]}
                        onPress={() => handleRequestToJoin(c)}
                        disabled={isRequested || isJoining}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isRequested
                            ? `Requested to join ${c.name}`
                            : `Request to join ${c.name}`
                        }
                        accessibilityState={{
                          disabled: isRequested || isJoining,
                        }}
                        activeOpacity={0.8}
                      >
                        {isJoining ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text
                            style={[
                              styles.joinButtonText,
                              isRequested && styles.joinButtonTextRequested,
                            ]}
                          >
                            {isRequested ? "Requested" : "Request to join"}
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// -------- STYLES --------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  searchBar: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  searchInput: {
    marginLeft: 10,
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },

  bannerContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: 180,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 12,
  },

  tab: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },

  activeTab: {
    backgroundColor: "#f97316",
  },
  tabText: {
    color: "#6b7280",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },


  segment: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 30,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 26,
    alignItems: "center",
  },
  segmentTabActive: {
    backgroundColor: "#f97316",
  },
  segmentText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 15,
  },
  segmentTextActive: {
    color: "#fff",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  filterChipActive: {
    backgroundColor: "#fff7ed",
    borderColor: "#fed7aa",
  },
  filterChipText: {
    color: "#3b1b0d",
    fontWeight: "600",
    fontSize: 13,
  },
  filterChipTextActive: {
    color: "#c2410c",
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#e5e7eb",
  },

  emptyContainer: {
    paddingTop: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },

  communityList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  communityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 12,
  },
  communityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  communityAvatarPlaceholder: {
    backgroundColor: "#3b1b0d",
    justifyContent: "center",
    alignItems: "center",
  },
  communityInfo: {
    flex: 1,
  },
  communityName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  communityDescription: {
    marginTop: 2,
    fontSize: 13,
    color: "#6b7280",
  },
  joinButton: {
    backgroundColor: "#f97316",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 92,
    alignItems: "center",
  },
  joinButtonRequested: {
    backgroundColor: "#f3f4f6",
  },
  joinButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  joinButtonTextRequested: {
    color: "#6b7280",
  },
});
