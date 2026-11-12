import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useDatabase } from "../context/DatabaseContext";

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const { profile, updateProfile } = useDatabase();

  const [name, setName] = useState(
    profile?.display_name ?? user?.display_name ?? "",
  );
  const [saving, setSaving] = useState(false);

  const avatarPath = profile?.avatar_path ?? null;
  const avatarUrl = avatarPath?.startsWith("http") ? avatarPath : null;

  // Photo upload returns with the Supabase Storage migration
  const handleChangePhoto = () => {
    Alert.alert("Coming soon", "Changing your profile photo isn't available yet.");
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User session expired. Please log in again.");
      return;
    }

    if (!name.trim()) {
      Alert.alert("Name required", "Please enter your name.");
      return;
    }

    try {
      setSaving(true);
      const updated = await updateProfile({ display_name: name.trim() });
      setUser({ ...user, display_name: updated.display_name });

      Alert.alert("Success", "Profile updated!");
      router.back();
    } catch (error) {
      console.error("Error updating profile:", error);
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

        <TouchableOpacity onPress={handleChangePhoto}>
          <Text style={styles.changePhoto}>Change profile photo</Text>
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
    color: "#414448ff",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  save: {
    fontSize: 16,
    fontWeight: "700",
    color: "#414448ff",
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
    color: "#f97316",
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
