import React, { createContext, useContext, useState, useEffect } from "react";
import {AppState, Platform } from "react-native";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";

export type SignUpInput = {
  email: string;
  password: string;
  displayName: string;
};

export type SignInInput = {
  email: string;
  password: string;
};

export type AppUser = {
  id: string;              // profiles.id / auth user UUID
  email: string | null;    // from the auth session
  display_name: string;    // profiles.display_name
  avatar_path: string | null;
  created_at: string;
};

type AuthContextType = {
  user: AppUser | null;
  loading: boolean;
  setUser: (u: AppUser | null) => void;
  login: (signInInput: SignInInput) => Promise<void>;
  signup: (signUpInput: SignUpInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAppUser(session: Session | null): Promise<AppUser | null> {
    if (!session?.user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_path, created_at")
      .eq("id", session.user.id)
      .single();

    if (error || !profile) {
      console.error("Profile load error:", error);
      return null;
    }

    return {
      id: profile.id,
      email: session.user.email ?? null,
      display_name: profile.display_name,
      avatar_path: profile.avatar_path,
      created_at: profile.created_at,
    };
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session }, error}) => {
      if (error) console.error("Session restore error:", error);
      if (mounted) setUser(await loadAppUser(session));
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setTimeout(async () => {
          if (mounted) setUser(await loadAppUser(session));
        }, 0);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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

  const login = async (signInInput: SignInInput) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: signInInput.email,
      password: signInInput.password,
    });

    if (error) throw error;
  }

  const signup = async (signUpInput: SignUpInput) => {
    const { error } = await supabase.auth.signUp({
      email: signUpInput.email,
      password: signUpInput.password,
      options: {
        data: { display_name: signUpInput.displayName },
        emailRedirectTo: "heynbr://auth/callback",
      },
    });
    
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

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