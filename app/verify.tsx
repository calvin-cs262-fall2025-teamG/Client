import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../context/AuthContext";

export default function VerificationCodeScreen({
  email,
  onVerificationSuccess,
}: {
  email: string;
  onVerificationSuccess: () => void;
}) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { verifyAndLogin, sendCode } = useAuth();

  // Countdown timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    if (code.length < 4) {
      Alert.alert("Error", "Verification code must be at least 4 digits");
      return;
    }

    try {
      setIsLoading(true);
      await verifyAndLogin(email, code);
      onVerificationSuccess();
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Invalid verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      await sendCode(email);
      setCode("");
      setTimeLeft(600);
      Alert.alert("Success", "A new verification code has been sent to your email");
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to resend code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isExpired = timeLeft === 0;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification code to:
        </Text>
        <Text style={styles.email}>{email}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={6}
            value={code}
            onChangeText={setCode}
            editable={!isLoading && !isExpired}
          />
        </View>

        <View style={styles.timerContainer}>
          <Text
            style={[styles.timer, isExpired && styles.timerExpired]}
          >
            {isExpired ? "Code expired" : `Code expires in ${formatTime(timeLeft)}`}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, (isLoading || isExpired) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || isExpired}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Verify & Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResendCode}
          disabled={isLoading}
        >
          <Text style={styles.resendText}>
            Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E6F4FE",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: "#3b1b0d",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3b1b0d",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    textAlign: "center",
  },
  email: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3b1b0d",
    marginBottom: 32,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: "white",
    letterSpacing: 2,
    textAlign: "center",
  },
  timerContainer: {
    marginBottom: 24,
    alignItems: "center",
  },
  timer: {
    fontSize: 13,
    color: "#666",
  },
  timerExpired: {
    color: "#e74c3c",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#3b1b0d",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  resendLink: {
    color: "#3b1b0d",
    fontWeight: "600",
  },
});
