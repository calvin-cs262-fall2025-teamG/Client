import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { items } from "../services/api";

export default function EditItem() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    image?: string;
  }>();

  const id = params.id ? Number(params.id) : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"available" | "borrowed">("available"); // ADD THIS
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load item from API on mount
  useEffect(() => {
    const loadItem = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const item: any = await items.getById(id);
        setTitle(item.name || "");
        setDescription(item.description || "");
        setCategory(item.category || "");
        setImageUrl(item.image_url || "");
        // Set status based on request_status from database
        setStatus(item.request_status === "available" ? "available" : "borrowed");
      } catch (error) {
        console.error("Failed to load item:", error);
        Alert.alert("Error", "Could not load item details.");
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  const handleSave = async () => {
    if (!id) {
      Alert.alert("Error", "Invalid item ID.");
      return;
    }

    if (!title.trim()) {
      Alert.alert("Missing title", "Please give your item a name.");
      return;
    }

    const updated = items.map((item: any) =>
      item.id === id ? { ...item, name: title, image: imageUri } : item
    );

    try {
      await items.update(id, {
        name: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        request_status: status, // Save the status
      });

      Alert.alert("Success", "Item updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to save edits:", error);
      Alert.alert("Error", "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const stored = await AsyncStorage.getItem("userItems");
          let items = stored ? JSON.parse(stored) : [];

          const updated = items.filter((item: any) => item.id !== id);
          await AsyncStorage.setItem("userItems", JSON.stringify(updated));

    Alert.alert(
      "Delete item?",
      "This will permanently remove the item from your listings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await items.delete(id);
              Alert.alert("Deleted", "Item removed successfully.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error) {
              console.error("Failed to delete item:", error);
              Alert.alert("Error", "Could not delete the item.");
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#f97316" />
          <Text style={styles.loadingText}>Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Invalid item ID</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Back button header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Item</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Image preview */}
        {imageUrl && imageUrl.startsWith('http') && (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Vacuum, Keurig, tool set..."
          style={styles.input}
          editable={!saving}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Tools, Home, Books, etc."
          style={styles.input}
          editable={!saving}
        />

        {/* STATUS TOGGLE */}
        <View style={styles.statusSection}>
          <Text style={styles.label}>Item Status</Text>
          <View style={styles.statusToggle}>
            <TouchableOpacity
              style={[
                styles.statusButton, 
                status === 'available' && styles.statusActive
              ]}
              onPress={() => setStatus('available')}
              disabled={saving}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={20} 
                color={status === 'available' ? '#16a34a' : '#9ca3af'} 
              />
              <Text style={[
                styles.statusText,
                status === 'available' && styles.statusTextActive
              ]}>
                Available
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.statusButton, 
                status === 'borrowed' && styles.statusActive
              ]}
              onPress={() => setStatus('borrowed')}
              disabled={saving}
            >
              <Ionicons 
                name="time" 
                size={20} 
                color={status === 'borrowed' ? '#f97316' : '#9ca3af'} 
              />
              <Text style={[
                styles.statusText,
                status === 'borrowed' && styles.statusTextActive
              ]}>
                Borrowed
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.statusHint}>
            {status === 'available' 
              ? 'Item is ready to lend out' 
              : 'Item is currently borrowed by someone'}
          </Text>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short description of the item, condition, etc."
          multiline
          style={[styles.input, styles.multiline]}
          editable={!saving}
        />

        <View style={styles.buttonRow}>
          <Button
            title={saving ? "Saving..." : "Save changes"}
            onPress={handleSave}
            disabled={saving}
          />
        </View>

        <View style={styles.buttonRow}>
          <Button
            color="red"
            title={saving ? "Deleting..." : "Delete item"}
            onPress={handleDelete}
            disabled={saving}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  errorText: {
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "600",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 4,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  image: {
    width: "100%",
    height: undefined,
    aspectRatio: 1,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: "#e5e7eb",
  },
  buttonRow: {
    marginTop: 12,
  },
  
  // Status toggle styles
  statusSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  statusToggle: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  statusActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  statusTextActive: {
    color: "#f97316",
  },
  statusHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
});