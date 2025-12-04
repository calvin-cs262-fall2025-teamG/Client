import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email.toLowerCase().endsWith("@calvin.edu")) {
      alert("Please use your @calvin.edu email.");
      return;
    }

    // add real backend auth later here

    await login(); // sets isLoggedIn = true and saves to AsyncStorage
    router.replace("/(tabs)"); // go to home tabs
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hey, Neighbor!</Text>
      <Text style={styles.subtitle}>Log in with your Calvin email</Text>

      <TextInput
        style={styles.input}
        placeholder="you@calvin.edu"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: { fontSize: 16, marginVertical: 12, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  button: {
    marginTop: 20,
    padding: 14,
    borderRadius: 999,
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
});
