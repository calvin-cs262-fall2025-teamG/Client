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
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";

const logo = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { login, signup } = useAuth(); // ✅ Get both login and signup

  const handleSubmit = async () => {
    setError(null);

    // Validate Calvin email
    if (!email.toLowerCase().endsWith("@calvin.edu")) {
      setError("Please use your @calvin.edu email.");
      return;
    }

    if (!password) {
      setError("Please enter a password");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setLoading(true);

      // ✅ Call signup or login based on mode
      if (mode === "signup") {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }

      // Navigate to main app
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !email || !password || (mode === "signup" && !name.trim()) || loading;
  const isLogin = mode === "login";

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo + Title */}
          <View style={styles.header}>
            <Image source={logo} style={styles.logo} />
            <Text style={styles.appName}>Hey, Neighbor!</Text>
          </View>

          {/* Mode Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
              onPress={() => {
                setMode("login");
                setError(null);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  isLogin && styles.toggleTextActive,
                ]}
              >
                Log in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                !isLogin && styles.toggleButtonActive,
              ]}
              onPress={() => {
                setMode("signup");
                setError(null);
              }}
            >
              <Text
                style={[
                  styles.toggleText,
                  !isLogin && styles.toggleTextActive,
                ]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            {/* Name field - only show for signup */}
            {!isLogin && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </>
            )}

            <Text style={[styles.label, !isLogin && { marginTop: 14 }]}>
              Calvin email
            </Text>
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
                placeholder={isLogin ? "Your password" : "Create a password"}
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
            onPress={handleSubmit}
            disabled={isButtonDisabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {isLogin ? "Log in" : "Sign up"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Helper text */}
          <Text style={styles.footerText}>
            {isLogin 
              ? "Use your @calvin.edu email to log in" 
              : "Create an account with your @calvin.edu email"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
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
    marginBottom: 18,
  },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 24,
    marginBottom: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#341801ff",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    padding: 3,
    marginTop: 12,
    marginBottom: 14,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  toggleTextActive: {
    color: "#f97316",
  },
  inputGroup: {
    marginTop: 4,
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