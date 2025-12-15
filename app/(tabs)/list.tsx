import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { items as itemsApi } from "../../services/api";
import PageContainer from "../components/PageContainer";
import Constants from "expo-constants";

function getHost() {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(":")?.[0];
  return host || "localhost";
}

const BASE_URL = `http://${getHost()}:3001`;

export default function ListItem() {
  const router = useRouter();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please grant photo library access.");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;

    try {
      const formData = new FormData();

      const uriParts = imageUri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("photo", {
        uri: imageUri,
        name: `item_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await fetch(`${BASE_URL}/items/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.filename;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Please add a title for your item.");
      return;
    }

    if (!user?.user_id) {
      Alert.alert("Error", "You must be logged in to list an item.");
      return;
    }

    try {
      setUploading(true);

      // Upload image first (if exists)
      let imageFilename = null;
      if (imageUri) {
        imageFilename = await uploadImage();
      }

      // Create item in database
      await itemsApi.create({
        name: title.trim(),
        description: description.trim() || undefined,
        image_url: imageFilename || undefined,
        category: category.trim() || "Other",
        owner_id: user.user_id,
        request_status: "available",
        start_date: new Date().toISOString(),  // ← Add this
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // ← Add this (30 days from now)
      });

      Alert.alert("Success", "Your item has been listed!", [
        { text: "OK", onPress: () => router.push("/(tabs)/profile") },
      ]);

      // Clear form
      setTitle("");
      setDescription("");
      setCategory("");
      setImageUri(null);
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
        onPress={pickImage}
        disabled={uploading}
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
            resizeMode="cover"
          />) : (
          <View style={styles.addPhotoBox}>
            <Text style={styles.addPhotoText}>Add a Photo</Text>
            <Text style={styles.subText}>Tap to upload from your gallery</Text>
          </View>
        )}
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
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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