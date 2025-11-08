import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ correct import
import { useBookmarks } from "./context/BookmarksContext";
import CloseButton from "./components/CloseButton";

export default function BookmarkScreen() {
  const { ids, byId, remove, ready } = useBookmarks();

  const data = Array.from(ids)
    .map((id) => byId[id])
    .filter(Boolean);

  if (!ready) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Bookmarks</Text>
          <Text>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (data.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Bookmarks</Text>
          <Text>No items saved yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <CloseButton />
      <View style={styles.container}>
        <Text style={styles.title}>Bookmarks</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <TouchableOpacity onPress={() => remove(item.id)}>
                <Text style={styles.remove}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 40, // ✅ added this to give extra space below notch/time
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemTitle: { fontSize: 16 },
  remove: { fontSize: 14, color: "#ef4444" },
  separator: { height: 1, backgroundColor: "#e5e7eb" },
});
