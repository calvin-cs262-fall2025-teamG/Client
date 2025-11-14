import React from "react";
import {
  Image,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";

const charger = require("../assets/images/charger.jpg");
const corebook = require("../assets/images/corebook.jpg");
const chair = require("../assets/images/chair.jpg");
const tools = require("../assets/images/tools.jpg");
const tractor = require("../assets/images/tractor.jpg");
const vacuum = require("../assets/images/vacuum.jpg");
const keurig = require("../assets/images/keurig.png");

interface Item {
  id: number;
  name: string;
  count: number;
  image: any;
  category: string;
  status: "none" | "borrowed";
}

const presetItems: Item[] = [
  {
    id: 1,
    name: "USB-C Charger",
    count: 254,
    image: charger,
    category: "Popular",
    status: "none",
  },
  {
    id: 2,
    name: "Core 100 Book",
    count: 243,
    image: corebook,
    category: "Books",
    status: "borrowed",
  },
  {
    id: 3,
    name: "Office Chair",
    count: 180,
    image: chair,
    category: "Home",
    status: "none",
  },
  {
    id: 4,
    name: "Keurig",
    count: 180,
    image: keurig,
    category: "Home",
    status: "none",
  },
  {
    id: 5,
    name: "Tool Set",
    count: 156,
    image: tools,
    category: "Tools",
    status: "none",
  },
  {
    id: 6,
    name: "Garden Tractor",
    count: 180,
    image: tractor,
    category: "Tools",
    status: "none",
  },
  {
    id: 7,
    name: "Vacuum",
    count: 156,
    image: vacuum,
    category: "Home",
    status: "borrowed",
  },
];

export default function Bookmark() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.grid}>
          {presetItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.item}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              <View style={styles.imageContainer}>
                {item.status === "borrowed" && (
                  <View style={[styles.statusBadge, styles.statusBorrowed]}>
                    <Text style={styles.statusText}>Borrowed</Text>
                  </View>
                )}

                <Image
                  source={item.image}
                  style={[
                    styles.image,
                    item.status === "borrowed" && { opacity: 0.55 },
                  ]}
                />
              </View>
              <View style={styles.info}>
                <Text
                  style={[
                    styles.name,
                    item.status === "borrowed" && { opacity: 0.7 },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.count,
                    item.status === "borrowed" && { opacity: 0.7 },
                  ]}
                >
                  {item.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  scrollViewContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    width: "47.5%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#f3f4f6",
  },
  image: {
    width: "100%",
    height: "100%",
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
  statusBorrowed: {
    backgroundColor: "#f73e3eaf",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  count: {
    fontSize: 13,
    color: "#6b7280",
  },
});
