import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { User } from "../../services/authServices";
import { users as usersApi, BASE_URL } from "../../services/api";

export default function ListerProfile() {
  const { name, id } = useLocalSearchParams<{ name: string; id?: string }>();
  const userId = id ? Number(id) : NaN;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!Number.isNaN(userId));

  useEffect(() => {
    if (Number.isNaN(userId)) return;

    let cancelled = false;
    setLoading(true);

    usersApi
      .getById(userId)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch((e) => {
        console.error("Failed to load user:", e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = user?.name || name;
  const avatarUrl = user?.profile_picture?.startsWith("http")
    ? user.profile_picture
    : user?.profile_picture
    ? `${BASE_URL}/uploads/${user.profile_picture}`
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`${displayName}'s Profile`}</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#f97316" style={styles.avatar} />
      ) : avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.placeholder]}>
          <Ionicons name="person" size={42} color="#9ca3af" />
        </View>
      )}

      <Text style={styles.subtitle}>More details coming soon…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  placeholder: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: { fontSize: 16, color: "#6b7280" },
});
