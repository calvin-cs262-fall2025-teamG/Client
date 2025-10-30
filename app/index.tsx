
// app/index.tsx
import { useEffect } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const router = useRouter();
  const navState = useRootNavigationState();

  // Replace this with your real auth check
  const userIsLoggedIn = false;

  useEffect(() => {
    // ✅ Wait until the navigation tree is ready
    if (!navState?.key) return;
    
    // TODO: make some way to figure out if user is logged in;
    if (userIsLoggedIn) {
      router.replace('/home');
    } else {
      router.replace('/login');
    }
  }, [navState?.key]);

  // Show a loader until router is mounted
  if (!navState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}

