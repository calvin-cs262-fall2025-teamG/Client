import React from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useBookmarks } from "../context/BookmarksContext";

export default function BookmarkScreen() {
  const { ids, byId, remove } = useBookmarks();
  const data = Array.from(ids).map((id) => byId[id]).filter(Boolean);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Items</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No bookmarks yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.title}</Text>
            <TouchableOpacity onPress={() => remove(item.id)}>
              <Text style={styles.remove}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  empty: { color: "#6b7280", marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  name: { fontSize: 16 },
  remove: { color: "#ef4444", fontWeight: "600" },
  sep: { height: 1, backgroundColor: "#e5e7eb" },
});
