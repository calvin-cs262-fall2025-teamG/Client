import { apiRequest } from './api';

export type User = {
  user_id: number;
  email: string;
  name: string;
  rating: number;
  avatar_url?: string;
  created_at: string;
};

export type SignupData = {
  email: string;
  password: string;
  name: string;
};

export type LoginData = {
  email: string;
  password: string;
};

type AuthResponse = {
  message: string;
  user: User;
};

/**
 * Sign up a new user
 * POST /auth/signup
 */
export async function signup(data: SignupData): Promise<User> {
  const response = await apiRequest<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.user;
}

/**
 * Login an existing user
 * POST /auth/login
 */
export async function login(data: LoginData): Promise<User> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.user;
}

/**
 * Get user profile by ID
 * GET /users/:id
 */
export async function getUserProfile(userId: number): Promise<User> {
  return apiRequest<User>(`/users/${userId}`);
}