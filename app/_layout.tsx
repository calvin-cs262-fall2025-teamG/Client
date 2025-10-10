// including this bc VS Code gave me errors;
import { Stack } from "expo-router";
import React from "react";

export default function RootLayout() {
  return (<Stack>
    <Stack.Screen name="index" options={{ headerShown: false }} />
    {/* Other screens */}
  </Stack>);
}
