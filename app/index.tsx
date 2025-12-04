import React from "react";
import { Redirect } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RootIndex() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
