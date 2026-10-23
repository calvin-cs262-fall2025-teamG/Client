import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useDatabase } from "../../context/DatabaseContext";
import PageContainer from "../components/PageContainer";

export default function ListItem() {
  const router = useRouter();
  const { user } = useAuth();
  const { myCommunities, createItem } = useDatabase();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);

  // With one community there is nothing to choose; with several the user picks
  const communityId =
    myCommunities.length === 1 ? myCommunities[0].id : selectedCommunityId;

  // Photo upload returns with the Supabase Storage migration
  const handleAddPhoto = () => {
    Alert.alert("Coming soon", "Photo upload is being moved to the new server.");
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please add a title for your item.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to list an item.");
      return;
    }

    if (myCommunities.length === 0) {
      Alert.alert(
        "Join a community first",
        "Items are shared within a community, so join one before listing.",
      );
      return;
    }

    if (!communityId) {
      Alert.alert("Community required", "Please choose a community for your item.");
      return;
    }

    try {
      setUploading(true);

      // The server sets the owner to the signed-in user and status to "available"
      await createItem({
        community_id: communityId,
        name: title.trim(),
        description: description.trim() || undefined,
        category: category.trim() || "Other",
      });

      Alert.alert("Success", "Your item has been listed!", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);

      // Clear form
      setTitle("");
      setDescription("");
      setCategory("");
      setSelectedCommunityId(null);
    } catch (error) {
      console.error("Failed to create item:", error);
      Alert.alert("Error", "Failed to list item. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageContainer>
      <Text style={styles.header}>List an Item to Share</Text>

      <TouchableOpacity
        style={styles.imagePicker}
        onPress={handleAddPhoto}
        disabled={uploading}
      >
        <View style={styles.addPhotoBox}>
          <Text style={styles.addPhotoText}>Add a Photo</Text>
          <Text style={styles.subText}>Photos are coming soon</Text>
        </View>
      </TouchableOpacity>

      <TextInput
        placeholder="Item name (e.g., 'Mini fridge')"
        placeholderTextColor="#6b7280"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        editable={!uploading}
      />

      <TextInput
        placeholder="Category (e.g., 'Tools', 'Home', 'Books')"
        placeholderTextColor="#6b7280"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
        editable={!uploading}
      />

      <TextInput
        placeholder="Description (optional)"
        placeholderTextColor="#6b7280"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
        editable={!uploading}
      />

      {myCommunities.length > 1 && (
        <View style={styles.communityList}>
          <Text style={styles.communityLabel}>Community</Text>
          {myCommunities.map((c) => {
            const selected = c.id === selectedCommunityId;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.input, selected && styles.communitySelected]}
                onPress={() => setSelectedCommunityId(c.id)}
                disabled={uploading}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.communityText,
                    selected && styles.communityTextSelected,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, uploading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Post Item</Text>
        )}
      </TouchableOpacity>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 20,
    color: "#111827",
  },
  imagePicker: {
    height: 250,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    overflow: "hidden",
  },
  addPhotoBox: {
    alignItems: "center",
  },
  addPhotoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f97316",
  },
  subText: {
    fontSize: 12,
    color: "#6b7280",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  communityList: {
    marginBottom: 4,
  },
  communityLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  communitySelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  communityText: {
    fontSize: 16,
    color: "#111827",
  },
  communityTextSelected: {
    fontWeight: "600",
    color: "#f97316",
  },
  button: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
