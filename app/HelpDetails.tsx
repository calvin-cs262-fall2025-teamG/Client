import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";

interface HelpContentProps {
  title: string;
  steps: readonly string[];
}

const HelpContent: React.FC<HelpContentProps> = ({ title, steps }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {steps.map((step, index) => (
      <View key={index} style={styles.step}>
        <Text style={styles.stepNumber}>{index + 1}.</Text>
        <Text style={styles.stepText}>{step}</Text>
      </View>
    ))}
  </View>
);

// Define help sections as a constant with proper typing
const HELP_SECTIONS = {
  listing: {
    title: "Listing an item",
    steps: [
      "You can list an item when you want to offer something to your neighbors.",
      'From the Home screen, tap the "+" button.',
      "Enter a short title that describes the item.",
      "Add a brief description with important details (time, condition, location).",
      "Tap the photo button to add a picture.",
      'Tap "Post" to publish your item to the feed.',
    ],
  },
  signup: {
    title: "Signing up and logging in",
    steps: [
      "Use your Calvin email to create an account and access all features.",
      'On the first screen, tap "Sign up."',
      "Enter your @calvin.edu email and a password.",
      'Tap "Create account."',
      "Open your email and tap the verification link.",
      'Return to the app, enter your email and password, and tap "Log in."',
    ],
  },
  messaging: {
    title: "Messaging a neighbor",
    steps: [
      "Messages let you coordinate details privately about a post.",
      "Open a post you are interested in.",
      'Tap the "Message" or "Contact" button on the post.',
      "Type your question or reply in the message box.",
      'Tap "Send" to start the conversation.',
      'Open the "Messages" tab later to see and respond to replies.',
    ],
  },
  searching: {
    title: "Searching for posts",
    steps: [
      "Search helps you quickly find specific items or offers.",
      "From the Home screen, tap the search bar or search icon.",
      'Type a keyword (for example, "bike," "vacuum," or "ride").',
      "(Optional) Apply filters such as category or distance.",
      'Tap "Search" or the keyboard\'s search button.',
      "Scroll through the results and tap a post to see more details.",
    ],
  },
  account: {
    title: "Managing your account",
    steps: [
      "Use your profile to update your information and view your activity.",
      'Tap your profile icon or "Profile" tab.',
      'Tap "Edit profile" to change your name or photo.',
      "Update any fields you want to change.",
      'Tap "Save" to keep your changes.',
      "Scroll to see your past posts and manage or delete them as needed.",
    ],
  },
  editing: {
    title: "Editing or deleting a post",
    steps: [
      "Change or remove a post if details are wrong or the item is no longer available.",
      'Go to your Profile or "My posts" section.',
      "Tap the post you want to change.",
      'To edit, tap "Edit," update the title, description, or photo, then tap "Save."',
      'To delete, tap "Delete" and confirm when the app asks if you\'re sure.',
    ],
  },
  logout: {
    title: "Logging out",
    steps: [
      "Tap on profile tab.",
      "Click the box with the arrow icon in the top right corner.",
    ],
  },
} as const;

export default function HelpDetailsScreen() {
  const { sectionKey } = useLocalSearchParams<{ sectionKey: string }>();

  // Type-safe access with fallback
  const currentSection = sectionKey && sectionKey in HELP_SECTIONS 
    ? HELP_SECTIONS[sectionKey as keyof typeof HELP_SECTIONS]
    : null;

  // Handle invalid section key
  if (!currentSection) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help</Text>
          <View style={styles.spacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Help topic not found</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <HelpContent
          title={currentSection.title}
          steps={currentSection.steps}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 8 },
  backText: { fontSize: 16, fontWeight: "600", color: "#f97316" },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
  },
  spacer: { width: 24 },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  step: { flexDirection: "row", marginBottom: 12 },
  stepNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#f97316",
    width: 24,
    marginRight: 8,
  },
  stepText: { flex: 1, fontSize: 16, lineHeight: 24, color: "#333" },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#6b7280",
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  errorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});