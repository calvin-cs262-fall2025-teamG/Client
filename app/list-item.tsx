import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function ListItem() {
  const router = useRouter();
  const [title, setTitle] = useState("");
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
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !imageUri) {
      alert("Please add a title and image");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: title,
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
    <View style={styles.container}>
      <Text style={styles.header}>List an Item</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={styles.addPhotoText}>+ Add Photo</Text>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder="Item Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Post Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 50, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  imagePicker: {
    height: 200,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  addPhotoText: { fontSize: 16, color: "#6b7280" },
  imagePreview: { width: "100%", height: "100%", borderRadius: 10 },
  input: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#f97316",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
