import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import bcryptjs from 'bcryptjs';
import * as SecureStore from 'expo-secure-store';

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Register a new user
 * @param username - Username for the new account
 * @param password - Plain text password
 * @returns Object with success status and optional error
 */
export async function register(username: string, password: string) {
  try {
    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, error: 'Username already exists' };
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password_hash: passwordHash }])
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (error: any) {
    return { success: false, error: error.message || 'Registration failed' };
  }
}

/**
 * Login user with username and password
 * @param username - Username
 * @param password - Plain text password
 * @returns Object with success status, user data, and optional error
 */
export async function login(username: string, password: string) {
  try {
    // Fetch user by username
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash')
      .eq('username', username)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Compare passwords
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Generate a simple session token or use Supabase's built-in auth
    // For now, we'll store a basic token (in production, use JWT or Supabase Auth)
    const sessionToken = JSON.stringify({ userId: user.id, username: user.username, timestamp: Date.now() });

    // Store session in secure storage
    await SecureStore.setItemAsync('auth_session', sessionToken);

    return {
      success: true,
      user: { id: user.id, username: user.username },
      token: sessionToken,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Login failed' };
  }
}

/**
 * Logout user
 */
export async function logout() {
  try {
    await SecureStore.deleteItemAsync('auth_session');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Logout failed' };
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const sessionToken = await SecureStore.getItemAsync('auth_session');
    if (sessionToken) {
      return JSON.parse(sessionToken);
    }
    return null;
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return null;
  }
}

/**
 * Initialize database schema (run once on app startup if needed)
 */
export async function initializeDatabase() {
  try {
    // Create users table if it doesn't exist
    const { error } = await supabase.rpc('create_users_table_if_not_exists', {});

    if (error) {
      console.warn('Could not create users table via RPC:', error);
      // Table might already exist, which is fine
    }

    return { success: true };
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return { success: false, error: error.message };
  }
}
