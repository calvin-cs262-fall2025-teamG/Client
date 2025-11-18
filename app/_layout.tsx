import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { BookmarksProvider } from "../context/BookmarksContext";
import LoginScreen from "./login";
import VerificationCodeScreen from "./verify";

function RootLayoutContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState<string | null>(null);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b1b0d" />
      </View>
    );
  }

  // Not authenticated - show login flow
  if (!isAuthenticated) {
    return (
      <>
        {!email ? (
          <LoginScreen onCodeSent={setEmail} />
        ) : (
          <VerificationCodeScreen
            email={email}
            onVerificationSuccess={() => {
              setEmail(null);
            }}
          />
        )}
      </>
    );
  }

  // Authenticated - show app
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen
        name="bookmark"
        options={{
          title: "Bookmarks",
          headerStyle: { backgroundColor: "white" },
          headerTintColor: "#3b1b0d",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <Stack.Screen
        name="item/[id]"
        options={{
          title: "Item Info",
          headerStyle: { backgroundColor: "white" },
          headerTintColor: "#3b1b0d",
          headerBackButtonDisplayMode: "minimal",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />

      <Stack.Screen
        name="borrow-confirmation"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="chat-thread"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarksProvider>
        <RootLayoutContent />
      </BookmarksProvider>
    </AuthProvider>
  );
}
