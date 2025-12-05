import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored auth state on startup
  useEffect(() => {
    const load = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("userEmail");
        if (savedEmail) {
          setUser({ email: savedEmail });
          setIsLoggedIn(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Login with email
  const login = async (email: string) => {
    setUser({ email });
    setIsLoggedIn(true);
    await AsyncStorage.setItem("userEmail", email);
  };

  // Logout & clear storage
  const logout = async () => {
    setUser(null);
    setIsLoggedIn(false);
    await AsyncStorage.removeItem("userEmail");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isLoading, login, logout }}
    >
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
