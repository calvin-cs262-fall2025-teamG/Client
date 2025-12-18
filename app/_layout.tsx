import { Stack } from "expo-router";
import { AuthProvider } from "../context/AuthContext";
import { BookmarksProvider } from "../context/BookmarksContext";
// Added comment

export default function RootLayout() {
  return (
    <AuthProvider>
      <BookmarksProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
           <Stack.Screen 
            name="index" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="bookmark" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="edit-item" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="edit-profile" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="item/[id]" 
            options={{ headerShown: false }} 
          />
            <Stack.Screen 
            name="chat-thread"
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="HelpDetails"
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="HelpList"
            options={{ headerShown: false }} 
          />
        </Stack>
      </BookmarksProvider>
    </AuthProvider>
  );
}