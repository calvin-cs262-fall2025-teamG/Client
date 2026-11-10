import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import {
  ActivityIndicator,
  Alert,
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
import { parseTimestamp } from "../../services/readState";
import ItemCard from "../components/ItemCard";
import ItemRow from "../components/ItemRow";
import {
  ITEM_CATEGORIES,
  matchesCategory,
  type ItemCategory,
} from "../../constants/categories";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORY_ICONS: Record<ItemCategory, IoniconName> = {
  Tools: "construct-outline",
  Outdoor: "leaf-outline",
  "Home & Garden": "flower-outline",
  Kitchen: "restaurant-outline",
  Books: "book-outline",
  Other: "cube-outline",
};

const NEW_ITEMS_LIMIT = 5;

// avatar_path is only shown when it is already a full URL.
const avatarUri = (path: string | null) =>
  path && /^https?:\/\//i.test(path) ? path : null;

function CommunityAvatar({
  community,
  size,
}: {
  community: Community;
  size: number;
}) {
  const avatar = avatarUri(community.avatar_path);
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return avatar ? (
    <Image source={{ uri: avatar }} style={shape} />
  ) : (
    <View style={[shape, styles.avatarPlaceholder]}>
      <Ionicons name="people" size={size * 0.46} color="#fff" />
    </View>
  );
}

type JoinProps = {
  community: Community;
  requested: boolean;
  joining: boolean;
  onPress: (community: Community) => void;
};

function JoinButton({ community, requested, joining, onPress }: JoinProps) {
  const disabled = requested || joining;
  return (
    <TouchableOpacity
      style={[styles.joinButton, requested && styles.joinButtonRequested]}
      onPress={() => onPress(community)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        requested
          ? `Requested to join ${community.name}`
          : `Request to join ${community.name}`
      }
      accessibilityState={{ disabled }}
      activeOpacity={0.8}
    >
      {joining ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text
          style={[
            styles.joinButtonText,
            requested && styles.joinButtonTextRequested,
          ]}
        >
          {requested ? "Requested" : "Request to join"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function DiscoverScreen() {
  const { myCommunities, requestToJoin } = useDatabase();

  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [showAllCommunities, setShowAllCommunities] = useState(false);

  const [availableOnly, setAvailableOnly] = useState(false);
  const [activeCommunity, setActiveCommunity] = useState(ALL_COMMUNITIES);

  // The Filters sheet edits a draft that is applied by Show results.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftAvailableOnly, setDraftAvailableOnly] = useState(false);
  const [draftCommunity, setDraftCommunity] = useState(ALL_COMMUNITIES);

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
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

  const communityNames = useMemo(() => {
    const names: Record<string, string> = {};
    myCommunities.forEach((c) => {
      names[c.id] = c.name;
    });
    return names;
  }, [myCommunities]);

  // Communities the user can ask to join: everything they aren't an active member of.
  const joinableCommunities = useMemo(() => {
    const mine = new Set(myCommunities.map((c) => c.id));
    return allCommunities.filter((c) => !mine.has(c.id));
  }, [allCommunities, myCommunities]);

  const newItems = useMemo(
    () =>
      items
        .filter((it) => communityNames[it.community_id] !== undefined)
        .sort(
          (a, b) => parseTimestamp(b.created_at) - parseTimestamp(a.created_at),
        )
        .slice(0, NEW_ITEMS_LIMIT),
    [items, communityNames],
  );

  const query = searchQuery.trim().toLowerCase();
  const showingResults = query !== "" || category !== null;

  const matchingItems = useMemo(
    () =>
      filterItemsByCommunity(items, activeCommunity).filter(
        (it) =>
          (!category || matchesCategory(it, category)) &&
          (!query ||
            it.name.toLowerCase().includes(query) ||
            (it.description ?? "").toLowerCase().includes(query)) &&
          (!availableOnly || it.status === "available"),
      ),
    [items, activeCommunity, category, query, availableOnly],
  );

  const activeFilterCount =
    (availableOnly ? 1 : 0) + (activeCommunity !== ALL_COMMUNITIES ? 1 : 0);

  const openFilters = () => {
    setDraftAvailableOnly(availableOnly);
    setDraftCommunity(activeCommunity);
    setFiltersOpen(true);
  };

  const clearFilters = () => {
    setDraftAvailableOnly(false);
    setDraftCommunity(ALL_COMMUNITIES);
  };

  const applyFilters = () => {
    setAvailableOnly(draftAvailableOnly);
    setActiveCommunity(draftCommunity);
    setFiltersOpen(false);
  };

  const communityChips = [
    { id: ALL_COMMUNITIES, name: "All communities" },
    ...myCommunities,
  ];

  const showLabels = myCommunities.length >= 2;

  const renderAllCommunities = () => (
    <>
      <View style={styles.subHeader}>
        <TouchableOpacity
          onPress={() => setShowAllCommunities(false)}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#3b1b0d" />
        </TouchableOpacity>
        <Text style={styles.subHeaderTitle}>Communities to join</Text>
      </View>

      {joinableCommunities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No communities to join yet.</Text>
        </View>
      ) : (
        <View style={styles.communityList}>
          {joinableCommunities.map((c) => (
            <View key={c.id} style={styles.communityRow}>
              <CommunityAvatar community={c} size={52} />
              <View style={styles.communityInfo}>
                <Text style={styles.communityName} numberOfLines={1}>
                  {c.name}
                </Text>
                {!!c.description && (
                  <Text style={styles.communityDescription} numberOfLines={2}>
                    {c.description}
                  </Text>
                )}
              </View>
              <JoinButton
                community={c}
                requested={requested.has(c.id)}
                joining={joining === c.id}
                onPress={handleRequestToJoin}
              />
            </View>
          ))}
        </View>
      )}
    </>
  );

  const renderDefault = () => (
    <>
      {/* COMMUNITIES TO JOIN */}
      {joinableCommunities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Communities to join</Text>
            <TouchableOpacity
              onPress={() => setShowAllCommunities(true)}
              accessibilityRole="button"
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.joinCards}
          >
            {joinableCommunities.map((c) => (
              <View key={c.id} style={styles.joinCard}>
                <CommunityAvatar community={c} size={48} />
                <Text style={styles.joinCardName} numberOfLines={1}>
                  {c.name}
                </Text>
                <Text style={styles.joinCardDescription} numberOfLines={2}>
                  {c.description ?? ""}
                </Text>
                <JoinButton
                  community={c}
                  requested={requested.has(c.id)}
                  joining={joining === c.id}
                  onPress={handleRequestToJoin}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* BROWSE BY CATEGORY */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Browse by category</Text>
        </View>
        <View style={styles.tileGrid}>
          {ITEM_CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.tile}
              onPress={() => setCategory(c)}
              accessibilityRole="button"
              accessibilityLabel={`Browse ${c}`}
              activeOpacity={0.8}
            >
              <Ionicons name={CATEGORY_ICONS[c]} size={26} color="#3b1b0d" />
              <Text style={styles.tileText} numberOfLines={1}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NEW IN YOUR COMMUNITIES */}
      {newItems.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New in your communities</Text>
          </View>
          <View style={styles.rows}>
            {newItems.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                communityName={communityNames[it.community_id]}
              />
            ))}
          </View>
        </View>
      )}
    </>
  );

  const renderResults = () => (
    <>
      <View style={styles.resultsBar}>
        <View style={styles.resultsBarLeft}>
          {category && (
            <TouchableOpacity
              style={styles.categoryChip}
              onPress={() => setCategory(null)}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${category} filter`}
              activeOpacity={0.8}
            >
              <Text style={styles.categoryChipText}>{category}</Text>
              <Ionicons name="close" size={14} color="#c2410c" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.filtersButton}
          onPress={openFilters}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityValue={
            activeFilterCount > 0
              ? { text: `${activeFilterCount} on` }
              : undefined
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={22} color="#3b1b0d" />
          {activeFilterCount > 0 && (
            <View style={styles.filtersBadge} testID="filters-badge">
              <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ paddingTop: 30 }}>
          <ActivityIndicator />
        </View>
      ) : matchingItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>No items found</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {matchingItems.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              showCommunity={showLabels}
              communityName={communityNames[it.community_id]}
            />
          ))}
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {showAllCommunities ? (
          renderAllCommunities()
        ) : (
          <>
            <Text style={styles.title}>Discover</Text>

            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items or communities"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={18} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>

            {showingResults ? renderResults() : renderDefault()}
          </>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* FILTERS SHEET */}
      <Modal
        visible={filtersOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersOpen(false)}
      >
        <View style={styles.sheetContainer}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setFiltersOpen(false)}
            accessibilityLabel="Close filters"
          />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Filters</Text>

            <TouchableOpacity
              style={styles.sheetToggle}
              onPress={() => setDraftAvailableOnly((v) => !v)}
              accessibilityRole="checkbox"
              accessibilityLabel="Available only"
              accessibilityState={{ checked: draftAvailableOnly }}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetToggleText}>Available only</Text>
              <Ionicons
                name={draftAvailableOnly ? "checkbox" : "square-outline"}
                size={22}
                color={draftAvailableOnly ? "#f97316" : "#3b1b0d"}
              />
            </TouchableOpacity>

            {myCommunities.length >= 2 && (
              <>
                <Text style={styles.sheetSection}>Community</Text>
                <View style={styles.sheetChips}>
                  {communityChips.map((c) => {
                    const selected = draftCommunity === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        style={[
                          styles.filterChip,
                          selected && styles.filterChipActive,
                        ]}
                        onPress={() => setDraftCommunity(c.id)}
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
                </View>
              </>
            )}

            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={styles.clearButtonText}>Clear all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.showButton}
                onPress={applyFilters}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <Text style={styles.showButtonText}>Show results</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// -------- STYLES --------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3b1b0d",
    marginHorizontal: 16,
    marginTop: 12,
  },

  searchBar: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 12,
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

  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b1b0d",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f97316",
  },

  joinCards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  joinCard: {
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    gap: 6,
  },
  joinCardName: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  joinCardDescription: {
    fontSize: 13,
    color: "#6b7280",
    minHeight: 34,
  },

  tileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    paddingHorizontal: 16,
  },
  tile: {
    width: "31.5%",
    aspectRatio: 1,
    backgroundColor: "#FBEBD9",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 8,
  },
  tileText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3b1b0d",
  },

  rows: {
    paddingHorizontal: 16,
  },

  resultsBar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  resultsBarLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  categoryChipText: {
    color: "#c2410c",
    fontWeight: "600",
    fontSize: 13,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  filtersButton: {
    padding: 4,
  },
  filtersBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#f97316",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  filtersBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e5e7eb",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  sheetToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  sheetToggleText: {
    fontSize: 16,
    color: "#111827",
  },
  sheetSection: {
    marginTop: 12,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  sheetChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#3b1b0d",
    fontWeight: "700",
    fontSize: 15,
  },
  showButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 30,
    backgroundColor: "#f97316",
    alignItems: "center",
  },
  showButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
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

  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginTop: 12,
  },
  subHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3b1b0d",
  },

  communityList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 12,
  },
  avatarPlaceholder: {
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
