import React from "react";
import { Stack } from "expo-router";

export default function RootLayout() {
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
    </Stack>
  );
}
