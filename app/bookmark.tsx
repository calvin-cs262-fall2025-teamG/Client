import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useBookmarks } from "../context/BookmarksContext";
import PageContainer from "./components/PageContainer";

export default function BookmarkScreen() {
  const { ids, byId, remove, ready } = useBookmarks();

  const data = Array.from(ids)
    .map((id) => byId[id])
    .filter(Boolean);

  if (!ready) {
    return (
      <PageContainer>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.subText}>Loading...</Text>
      </PageContainer>
    );
  }

  if (data.length === 0) {
    return (
      <PageContainer>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.subText}>You haven’t saved anything yet.</Text>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  subText: {
    fontSize: 16,
    color: "#6b7280",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  itemTitle: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  remove: {
    fontSize: 14,
    color: "#f97316",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
  },
});
