import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { items as itemsApi } from "../../services/api";

type ApiItem = {
  item_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  category?: string | null;
  owner_id: number;
  request_status?: string | null;
};

const imageMap: Record<string, any> = {
  "drill.jpg": require("../../assets/images/drill.jpg"),
  "campingtent.jpg": require("../../assets/images/campingtent.jpg"),
};

const getImageSource = (raw?: string | null) => {
  if (!raw) return null;

  if (raw.startsWith("http")) return { uri: raw };

  const filename = raw.split("/").pop()?.toLowerCase() ?? raw.toLowerCase();

  if (imageMap[filename]) return imageMap[filename];

  return null;
};


const banner = require("../../assets/images/banner.png");

export default function DiscoverScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const [items, setItems] = useState<ApiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = async () => {
    try {
      const data = (await itemsApi.getAll()) as ApiItem[];
      setItems(data ?? []);
    } catch (e) {
      console.error("❌ Failed to load items:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadItems();
    setRefreshing(false);
  };

  // Build categories from DB
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((it) => {
      const c = (it.category ?? "").trim();
      if (c) set.add(c);
    });
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((it) => {
      const matchesCategory =
        activeCategory === "All" ||
        (it.category ?? "").toLowerCase() === activeCategory.toLowerCase();

      const matchesSearch = !q || it.name.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [items, searchQuery, activeCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
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
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.tab, activeCategory === cat && styles.activeTab]}
              onPress={() => {
                setActiveCategory(cat);
                setSearchQuery("");
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeCategory === cat && styles.activeTabText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>


        {/* ITEMS GRID */}
        {loading ? (
          <View style={{ paddingTop: 30 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map((it) => {
              const isBorrowed = (it.request_status ?? "available") !== "available";
              const src = getImageSource(it.image_url);

              return (
                <TouchableOpacity
                  key={it.item_id}
                  style={styles.card}
                  onPress={() => router.push(`/item/${it.item_id}`)}
                  activeOpacity={0.9}
                >
                  {src ? (
                    <Image
                      source={src}
                      style={[styles.cardImage, isBorrowed && { opacity: 0.55 }]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.noImageBox, isBorrowed && { opacity: 0.55 }]}>
                      <Ionicons name="image-outline" size={28} color="#9ca3af" />
                    </View>
                  )}

                  <Text style={styles.cardName} numberOfLines={1}>
                    {it.name}
                  </Text>

                  {isBorrowed && (
                    <View style={styles.borrowedBadge}>
                      <Text style={styles.borrowedText}>Borrowed</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 130,
    backgroundColor: "#e5e7eb",
  },
  noImageBox: {
    width: "100%",
    height: 130,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    padding: 10,
    color: "#111827",
  },

  borrowedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#f87171",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  borrowedText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
