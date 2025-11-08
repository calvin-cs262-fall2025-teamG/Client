import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import CloseButton from "./components/CloseButton";

export default function EditItem() {
  const router = useRouter();
  const { id, name, image } = useLocalSearchParams();

  const [title, setTitle] = useState(name as string);
  const [imageUri, setImageUri] = useState(image as string);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const saveEdit = async () => {
    const stored = await AsyncStorage.getItem("userItems");
    let items = stored ? JSON.parse(stored) : [];

    const updated = items.map((item: any) =>
      item.id == id ? { ...item, name: title, image: imageUri } : item
    );

    await AsyncStorage.setItem("userItems", JSON.stringify(updated));
    router.push("/");
  };

  const deleteItem = async () => {
    Alert.alert(
      "Delete Item",
      "Are you sure you want to delete this item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const stored = await AsyncStorage.getItem("userItems");
            let items = stored ? JSON.parse(stored) : [];
            const updated = items.filter((item: any) => item.id != id);
            await AsyncStorage.setItem("userItems", JSON.stringify(updated));
            router.push("/");
          },
        },
      ]
    );
  };


  return (
    <View style={styles.container}>
      <CloseButton />
      <Text style={styles.header}>Edit Item</Text>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
      </TouchableOpacity>

      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={saveEdit}>
        <Text style={styles.buttonText}>Save Changes</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={deleteItem}>
        <Text style={styles.deleteButtonText}>Delete Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  imagePicker: {
    height: 200,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
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
  deleteButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#ef4444",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
