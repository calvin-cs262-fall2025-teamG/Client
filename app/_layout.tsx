import React from "react";
import { Stack } from "expo-router";
import { BookmarksProvider } from "../context/BookmarksContext";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarksProvider>
        <Stack initialRouteName="index">
          {/* 👇 New onboarding entry screen */}
          <Stack.Screen
            name="index"
            options={{ headerShown: false }}
          />

          {/* Auth flow (login / signup) */}
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false }}
          />

          {/* Main app with bottom tabs */}
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false }}
          />

          {/* Existing extra screens */}
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
      </BookmarksProvider>
    </AuthProvider>
  );
}
