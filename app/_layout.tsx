import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { BookmarksProvider } from "../context/BookmarksContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarksProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </BookmarksProvider>
    </AuthProvider>
  );
}