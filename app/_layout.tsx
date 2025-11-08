import React from "react";
import { Stack } from "expo-router";
import { BookmarksProvider } from "../context/BookmarksContext";

export default function RootLayout() {
  return (
    <BookmarksProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="bookmark" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="browse" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="profile" />
      </Stack>
    </BookmarksProvider>
  );
}
