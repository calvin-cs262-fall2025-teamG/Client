import { View, Text, StyleSheet, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function ListerProfile() {
  const { name } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{`${name}'s Profile`}</Text>

      <Image
        source={require("../../assets/images/laila.png")}
        style={styles.avatar}
      />

      <Text style={styles.subtitle}>More details coming soon…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 12 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#6b7280" },
});
