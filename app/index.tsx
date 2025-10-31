
// app/index.tsx
import { useRouter, useRootNavigationState, Redirect } from 'expo-router';

export default function Index() {
  return (
    <Redirect href="/login"></Redirect>
  );
}

