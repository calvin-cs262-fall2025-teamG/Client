import React, { createContext, useContext, useState, useEffect } from "react";
import {AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../services/authServices";
import { supabase } from "../app/utils/supabase";
import { 
  SignInInput, 
  SignUpInput,
  signUp,
  signIn,
  signOut
 } from"../services/supabaseAuth";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (signInInput: SignInInput) => Promise<void>;
  signup: (signUpInput: SignUpInput) => Promise<void>;
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

  useEffect(() => {
    if (Platform.OS === "web") return;

    const syncRefreshWithAppState = (state: string) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    };

    syncRefreshWithAppState(AppState.currentState ?? "background");

    const subscription = AppState.addEventListener(
      "change",
      syncRefreshWithAppState,
    );

    return () => {
      subscription.remove();
      supabase.auth.stopAutoRefresh();
    };
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

  const login = async (signInInput: SignInInput) => {
    const { error } = await signIn(signInInput);

    if (error) throw error;
  }

  const signup = async (signUpInput: SignUpInput) => {
    const { error } = await signUp(signUpInput);
    
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await signOut();

    if (error) throw error;
  }

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