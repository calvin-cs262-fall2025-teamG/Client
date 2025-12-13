import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { users as usersApi } from "../services/api";
import Constants from "expo-constants";

function getHost() {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(":")?.[0];
  return host || "localhost";
}

const BASE_URL = `http://${getHost()}:3001`; // Change for production

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  console.log("👤 User in edit-profile:", user);
  console.log("📷 Profile picture:", user?.profile_picture);

  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  const avatarUrl = localImageUri
    || (user?.profile_picture?.startsWith('http')
      ? user.profile_picture
      : user?.profile_picture
        ? `${BASE_URL}/uploads/${user.profile_picture}`
        : null);

  const handleChangePhoto = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant photo library access to change your profile picture."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;
      setLocalImageUri(imageUri);

      // Upload immediately
      await uploadImage(imageUri);
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image.");
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploading(true);

      const formData = new FormData();
      const uriParts = uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      formData.append("photo", {
        uri,
        name: `profile.${fileType}`,
        type: `image/${fileType}`,
      } as any);

      const response = await fetch(
        `${BASE_URL}/users/${user!.user_id}/profile-picture`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Upload failed:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }

      const uploadResponse = await response.json();

      // Update the database with the new profile picture filename
      const updatedUser = await usersApi.update(user!.user_id, {
        profile_picture: uploadResponse.filename
      });

      setUser(updatedUser as any);

      Alert.alert("Success", "Profile picture updated!");
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Failed to upload image.");
      setLocalImageUri(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    console.log("🔘 Save button clicked!");
    console.log("👤 Current user:", user);
    console.log("👤 User ID:", user?.user_id);

    if (!user?.user_id) {
      Alert.alert("Error", "User session expired. Please log in again.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    console.log("📝 Updating name to:", name.trim());

    try {
      setSaving(true);
      const updated = await usersApi.update(user.user_id, {
        name: name.trim(),
      });
      console.log("✅ Update successful:", updated);
      setUser(updated as any);

      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Edit Profile</Text>

        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.save, saving && { opacity: 0.5 }]}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Ionicons name="person" size={42} color="#9ca3af" />
          </View>
        )}

        {uploading && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        <TouchableOpacity onPress={handleChangePhoto} disabled={uploading}>
          <Text style={[styles.changePhoto, uploading && { opacity: 0.5 }]}>
            {uploading ? "Uploading..." : "Change profile photo"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Name field */}
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholder="Your name"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancel: {
    fontSize: 16,
    color: "#6b7280",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  save: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
    position: "relative",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e5e7eb",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  changePhoto: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
    color: "#2563eb",
  },
  field: {
    paddingHorizontal: 16,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderBottomWidth: 1,
    borderColor: "#d1d5db",
    fontSize: 16,
    color: "#111827",
  },
});