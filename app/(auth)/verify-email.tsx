import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../app/utils/supabase";

const logo = require("../../assets/images/logo.png");

export default function VerifyEmailScreen() {
  const emailParam = useLocalSearchParams<{ email?: string | string[] }>().email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam ?? "";
  const router = useRouter();
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setError(null);
    setResent(false);
    setResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: "heynbr://auth/callback" },
      });

      if (resendError) throw resendError;
      setResent(true);
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Could not resend the confirmation email.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Image source={logo} style={styles.logo} />
          <Text style={styles.title}>Confirm your email</Text>
        </View>

        <Ionicons name="mail-outline" size={42} color="#f97316" />
        <Text style={styles.message}>
          Follow the confirmation link we sent to:
        </Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.message}>
          After confirming, you&apos;ll be returned to Hey, Neighbor!
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}
        {resent && <Text style={styles.success}>Confirmation email sent.</Text>}

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleResend}
          disabled={resending || !email}
          style={[styles.button, (resending || !email) && styles.disabledButton]}
        >
          {resending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Resend confirmation email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.replace("/(auth)/login")}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>Back to sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  content: {
    alignItems: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logo: {
    width: 84,
    height: 84,
    marginBottom: 12,
    borderRadius: 20,
  },
  title: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    marginTop: 16,
    color: "#4b5563",
    fontSize: 16,
    textAlign: "center",
  },
  email: {
    marginTop: 6,
    color: "#111827",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  error: {
    marginTop: 16,
    color: "#b91c1c",
    textAlign: "center",
  },
  success: {
    marginTop: 16,
    color: "#15803d",
    textAlign: "center",
  },
  button: {
    minHeight: 48,
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 24,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#3b1b0d",
  },
  disabledButton: {
    opacity: 0.65,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  backButton: {
    marginTop: 20,
    padding: 8,
  },
  backButtonText: {
    color: "#6b7280",
    fontSize: 15,
  },
});