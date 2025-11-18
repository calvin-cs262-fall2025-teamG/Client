import { User } from "../context/AuthContext";

// Replace with your actual Azure backend URL
const API_BASE_URL = "https://your-azure-function-app.azurewebsites.net/api";

/**
 * Send a verification code to the user's email
 * Backend should insert a verification code record and send email
 */
export const sendVerificationCode = async (email: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to send verification code");
  }
};

/**
 * Verify the code provided by the user
 * Backend should check if the code matches the email and hasn't expired
 */
export const verifyCode = async (
  email: string,
  code: string
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Invalid verification code");
  }
};

/**
 * Get an existing user or create a new one
 * Backend should fetch user by email, or create if doesn't exist
 */
export const getOrCreateUser = async (email: string): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/auth/get-or-create-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get or create user");
  }

  return response.json();
};

/**
 * Fetch user profile by ID
 */
export const getUserProfile = async (userId: number): Promise<User> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch user profile");
  }

  return response.json();
};
