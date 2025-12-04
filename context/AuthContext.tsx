import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // check stored login state when app starts
    const load = async () => {
      try {
        const value = await AsyncStorage.getItem("loggedIn");
        setIsLoggedIn(value === "true");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const login = async () => {
    setIsLoggedIn(true);
    await AsyncStorage.setItem("loggedIn", "true");
  };

  const logout = async () => {
    setIsLoggedIn(false);
    await AsyncStorage.removeItem("loggedIn");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return ctx;
}