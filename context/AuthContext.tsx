import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authService from "../services/authServices";
import type { User } from "../services/authServices";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void; // ✅ add this
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_KEY = "@heyneighbor:user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch (error) {
      console.error("Load user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const u = await authService.login({ email, password });
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const u = await authService.signup({ email, password, name });
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(u));
      setUser(u);
    } catch (error: any) {
      throw new Error(error.message || "Signup failed");
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
