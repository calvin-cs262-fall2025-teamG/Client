import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Cart() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>Checkout Here</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#15803d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
});