import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TextInput, ScrollView, Image } from "react-native";
import { useRouter } from "expo-router";

// You can replace these with actual images later
const placeholderImage = "https://via.placeholder.com/80";

interface Listing {
  id: number;
  name: string;
  image: string;
}

const listings: Listing[] = [
  { id: 1, name: "Basketball", image: placeholderImage },
  { id: 2, name: "Laptop Charger", image: placeholderImage },
  { id: 3, name: "Textbook: Calculus", image: placeholderImage },
];

export default function Profile() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>👤 Profile</Text>

        {/* Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} placeholder="Your name" />
        </View>

        {/* School Year */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>School Year</Text>
          <TextInput style={styles.input} placeholder="e.g., Sophomore" />
        </View>

        {/* Listings */}
        <Text style={[styles.subtitle, { marginTop: 20 }]}>Your Listings</Text>
        {listings.map((item) => (
          <View key={item.id} style={styles.listing}>
            <Image source={{ uri: item.image }} style={styles.listingImage} />
            <Text style={styles.listingName}>{item.name}</Text>
          </View>
        ))}

        <Text
          style={styles.backButton}
          onPress={() => router.back()}
        >
          ← Back to Home
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    alignSelf: "flex-start",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  listing: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  listingName: {
    fontSize: 16,
    fontWeight: "500",
  },
  backButton: {
    marginTop: 30,
    color: "#15803d",
    fontSize: 16,
    fontWeight: "500",
  },
});

