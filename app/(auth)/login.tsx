// app/(auth)/login.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const logo = require("../../assets/images/logo.png");

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // still local-only for now
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async () => {
    setError(null);

    if (!email.toLowerCase().endsWith("@calvin.edu")) {
      setError("Please use your @calvin.edu email.");
      return;
    }

    try {
      setLoading(true);
      // currently just client-side login; backend can come later
      await login(email);
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !email || !password || loading;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        {/* Logo + Title */}
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.title}>Hey, Neighbor!</Text>
          <Text style={styles.subtitle}>
            Log in with your Calvin email to start borrowing and lending.
          </Text>
        </View>

        {/* Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Calvin email</Text>
          <View style={styles.inputRow}>
            <Ionicons
              name="mail-outline"
              size={18}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="you@calvin.edu"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <View style={styles.inputRow}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            isButtonDisabled && { opacity: 0.6 },
          ]}
          onPress={handleLogin}
          disabled={isButtonDisabled}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>

        {/* Tiny helper text */}
        <Text style={styles.footerText}>
          For now, any @calvin.edu email will sign you in.  
          Passwords and verification will be added in a later version.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 26,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  inputGroup: {
    marginTop: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
    paddingVertical: 4,
  },
  errorText: {
    marginTop: 10,
    color: "#b91c1c",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  footerText: {
    marginTop: 10,
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 14,
  },
});
