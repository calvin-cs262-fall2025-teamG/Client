import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { getOrCreateUser, sendVerificationCode, verifyCode } from "../lib/api";

export type User = {
  user_id: number;
  email: string;
  name: string;
  profile_picture?: string;
};

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendCode: (email: string) => Promise<void>;
  verifyAndLogin: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEY = "heyneighbor:auth:v1";

const AuthCtx = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from storage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const savedUser = JSON.parse(raw) as User;
          setUser(savedUser);
        }
      } catch (error) {
        console.error("Failed to load user from storage:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const sendCode = useCallback(async (email: string) => {
    try {
      await sendVerificationCode(email);
    } catch (error) {
      console.error("Failed to send verification code:", error);
      throw error;
    }
  }, []);

  const verifyAndLogin = useCallback(
    async (email: string, code: string) => {
      try {
        // Verify the code with the backend
        await verifyCode(email, code);

        // Get or create user
        const userData = await getOrCreateUser(email);
        setUser(userData);

        // Save to storage
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to verify code:", error);
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error("Failed to logout:", error);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      sendCode,
      verifyAndLogin,
      logout,
    }),
    [user, isLoading, sendCode, verifyAndLogin, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};
