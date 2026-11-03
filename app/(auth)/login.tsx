import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

const logo = require("../../assets/images/logo.png");

export default function LoginScreen() {
  const router = useRouter();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { login, signup } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const mode: "login" | "signup" = tab === "login" ? "login" : "signup";

  const handleSubmit = async () => {
    setError(null);

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

      if (mode === "signup") {
        // Signup
        await signup({email, password, displayName: name});

        router.push({
          pathname: "/(auth)/verify-email",
          params: { email },
        });
      } else {
        try {
          await login({email, password});
          router.replace("/(tabs)");
        } catch (err: any) {
          console.error("Login error:", err);

          const errorMessage = err?.message || "";
          if (
            errorMessage.includes("not verified") ||
            errorMessage.includes("verification") ||
            errorMessage.includes("verify")
          ) {
            router.push({
              pathname: "/(auth)/verify-email",
              params: { email },
            });
            return;
          }

          throw err;
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled =
    !email || !password || (mode === "signup" && !name.trim()) || loading;
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
        <View style={styles.heroWrap}>
          <View style={styles.brandRow}>
            <Image source={logo} style={styles.brandLogo} />
            <Text style={styles.brandText}>Hey, Neighbor!</Text>
          </View>

          <Text style={styles.kicker}>Need it? A neighbor’s got it.</Text>
          <Text style={styles.subKicker}>Your neighborhood starts here.</Text>
          <Text style={styles.heroTitle}>
            <Text style={styles.heroHighlight}>Hey,</Text> Neighbor
          </Text>

        </View>

        <View style={styles.authCard}>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                isLogin && styles.toggleButtonActive,
              ]}
              onPress={() => {
                router.setParams({ tab: "login" });
                setError(null);
              }}
            >
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>
                Log in
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
              onPress={() => {
                router.setParams({ tab: "signup" });
                setError(null);
              }}
            >
              <Text
                style={[styles.toggleText, !isLogin && styles.toggleTextActive]}
              >
                Sign up
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.formTitle}>{isLogin ? "Welcome back" : "Create account"}</Text>
          <Text style={styles.formSubtitle}>
            {isLogin
              ? "Sign in to keep borrowing and lending nearby."
              : "Join your local community and start sharing today."}
          </Text>

          <View style={styles.inputGroup}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color="#6b7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your full name"
                    placeholderTextColor="#a38f82"
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </>
            )}

            <Text style={[styles.label, !isLogin && { marginTop: 14 }]}>
              Email address
            </Text>
            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.label, styles.labelSpacing]}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#6b7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={isLogin ? "Your password" : "Create a password"}
                placeholderTextColor="#a38f82"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {isLogin && (
            <View style={styles.helperRow}>
              <Text style={styles.helperLink}>Forgot password?</Text>
            </View>
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, isButtonDisabled && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isButtonDisabled}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? "Log in" : "Sign up"}</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {isLogin
              ? "Sign in with your email address"
              : "Create an account with your email address"}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#efe7d9",
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  heroWrap: {
    alignItems: "center",
    paddingTop: 18,
    paddingHorizontal: 18,
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    marginRight: 8,
  },
  brandText: {
    color: "#4d3a2e",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kicker: {
    color: "#d57834",
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.6,
    marginBottom: 2,
    textAlign: "center",
    lineHeight: 30,
  },
  subKicker: {
    color: "#6c5248",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: "center",
    lineHeight: 22,
  },
  heroTitle: {
    fontSize: 64,
    lineHeight: 70,
    fontWeight: "800",
    letterSpacing: -2.6,
    color: "#4d3a2e",
    textAlign: "center",
    marginTop: 0,
  },
  heroHighlight: {
    color: "#d57834",
  },
  authCard: {
    alignSelf: "center",
    width: "92%",
    maxWidth: 500,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(98, 74, 62, 0.14)",
    paddingHorizontal: 24,
    paddingVertical: 18,
    shadowColor: "#362d29",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#f0e5d8",
    borderRadius: 18,
    padding: 4,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7a6a5d",
  },
  toggleTextActive: {
    color: "#d57834",
  },
  formTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#4d3a2e",
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    color: "#705d51",
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52443d",
    marginBottom: 4,
  },
  labelSpacing: {
    marginTop: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dccbb4",
    backgroundColor: "rgba(255,255,255,0.76)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    paddingVertical: 2,
  },
  helperRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
  },
  helperLink: {
    color: "#d57834",
    fontSize: 13,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 12,
    color: "#b91c1c",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    marginTop: 18,
    backgroundColor: "#d57834",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
  footerText: {
    marginTop: 18,
    textAlign: "center",
    color: "#5d4d45",
    fontSize: 14,
  },
  footerLink: {
    color: "#d57834",
    fontWeight: "700",
  },
});
