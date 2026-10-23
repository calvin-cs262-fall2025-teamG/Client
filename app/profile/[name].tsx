import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import { useDatabase } from "../../context/DatabaseContext";
import type { Profile } from "../../services/supabase_api";

export default function ListerProfile() {
  const { name, id } = useLocalSearchParams<{ name: string; id?: string }>();
  const userId = id || undefined;
  const { getProfile } = useDatabase();

  // Tag the fetched profile with its id so loading is derived during render
  // instead of being reset with setState inside the effect.
  const [result, setResult] = useState<
    { id: string; profile: Profile | null } | null
  >(null);
  const loading = !!userId && result?.id !== userId;
  const profile = result && result.id === userId ? result.profile : null;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    getProfile(userId)
      .then((p) => {
        if (!cancelled) setResult({ id: userId, profile: p });
      })
      .catch((e) => {
        console.error("Failed to load user:", e);
        if (!cancelled) setResult({ id: userId, profile: null });
      });

    return () => {
      cancelled = true;
    };
  }, [userId, getProfile]);

  const displayName = profile?.display_name || name;
  const avatarPath = profile?.avatar_path ?? null;
  const avatarUrl = avatarPath?.startsWith("http") ? avatarPath : null;

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
