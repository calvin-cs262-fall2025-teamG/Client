<<<<<<< HEAD
import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack />;
}
=======

import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
>>>>>>> 53a5cc7 (Updated Prototype)
