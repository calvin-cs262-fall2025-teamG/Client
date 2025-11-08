import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import PageContainer from "./components/PageContainer"; // 👈 replaces CloseButton + layout

export default function ListItem() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        alert("Permission required to select images.");
      }
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (!title || !imageUri) {
      alert("Please add a title and photo.");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: title,
      description,
      image: imageUri,
      count: 0,
      category: "User",
    };

    const stored = await AsyncStorage.getItem("userItems");
    const parsed = stored ? JSON.parse(stored) : [];
    const updated = [newItem, ...parsed];

    await AsyncStorage.setItem("userItems", JSON.stringify(updated));
    router.push("/");
  };

  return (
    <PageContainer>
      <Text style={styles.header}>List an Item to Share</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
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
      />

      <TextInput
        placeholder="Description (optional)"
        placeholderTextColor="#6b7280"
        value={description}
        onChangeText={setDescription}
        style={[styles.input, styles.textArea]}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Post Item</Text>
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
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
