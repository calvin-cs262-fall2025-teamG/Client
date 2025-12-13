import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../services/api";

const logo = require("../../assets/images/logo.png");

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const router = useRouter();
  const { setUser } = useAuth();

  const handleVerify = async () => {
    setError(null);

    if (!code.trim() || code.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    Keyboard.dismiss();

    try {
      setLoading(true);

      const response: any = await auth.verifyCode(email, code);

      if (response.verified && response.user) {
        setUser(response.user);
        router.replace("/(tabs)");
      } else if (response.alreadyVerified && response.user) {
        setUser(response.user);
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);
    setResendSuccess(false);

    try {
      setResending(true);

      await auth.resendVerification(email);
      setResendSuccess(true);

      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const isButtonDisabled = !code.trim() || code.length !== 6 || loading;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {/* Logo + Title */}
              <View style={styles.header}>
                <Image source={logo} style={styles.logo} />
                <Text style={styles.appName}>Verify Your Email</Text>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Ionicons name="mail" size={40} color="#f97316" />
                <Text style={styles.instructionsTitle}>Check your inbox</Text>
                <Text style={styles.instructionsText}>
                  We've sent a 6-digit code to
                </Text>
                <Text style={styles.emailText}>{email}</Text>
              </View>

              {/* Code Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Verification Code</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="key-outline"
                    size={18}
                    color="#6b7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="000000"
                    placeholderTextColor="#9ca3af"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ""))}
                    autoFocus
                  />
                </View>
              </View>

              {/* Error message */}
              {error && <Text style={styles.errorText}>{error}</Text>}

              {/* Success message */}
              {resendSuccess && (
                <Text style={styles.successText}>Code sent! Check your email.</Text>
              )}

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, isButtonDisabled && { opacity: 0.6 }]}
                onPress={handleVerify}
                disabled={isButtonDisabled}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code?</Text>
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resending}
                  style={styles.resendButton}
                >
                  {resending ? (
                    <ActivityIndicator size="small" color="#f97316" />
                  ) : (
                    <Text style={styles.resendButtonText}>Resend Code</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Back to Login */}
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={16} color="#6b7280" />
                <Text style={styles.backButtonText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  header: {
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 8,
  },
  appName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#341801ff",
  },
  instructionsContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 10,
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f97316",
    textAlign: "center",
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
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
    paddingVertical: 4,
    letterSpacing: 4,
    textAlign: "center",
  },
  errorText: {
    marginTop: 10,
    color: "#b91c1c",
    fontSize: 13,
    textAlign: "center",
  },
  successText: {
    marginTop: 10,
    color: "#059669",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
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
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    gap: 6,
  },
  resendText: {
    fontSize: 13,
    color: "#6b7280",
  },
  resendButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f97316",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 8,
    gap: 6,
  },
  backButtonText: {
    fontSize: 13,
    color: "#6b7280",
  },
});