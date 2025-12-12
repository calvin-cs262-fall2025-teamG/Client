import Constants from "expo-constants";

function getHost() {
  // Examples:
  // - "10.0.0.8:8081" (phone on same Wi-Fi)
  // - "localhost:8081" (simulator)
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ??
    (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
  const host = hostUri?.split(":")?.[0];
  return host || "localhost";
}

const BASE_URL = `http://${getHost()}:3001`; // Change for production
console.log("BASE_URL:", BASE_URL);

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

export const auth = {
  signup: (email: string, name: string) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  login: (email: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export const items = {
  getAll: () => apiRequest('/items'),

  getById: (id: number) => apiRequest(`/items/${id}`),

  create: (data: {
    name: string;
    description?: string;
    image_url?: string;
    category?: string;
    owner_id: number;
    request_status?: string;
    start_date?: string;
    end_date?: string;
  }) =>
    apiRequest('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: {
    name?: string;
    description?: string;
    image_url?: string;
    category?: string;
    request_status?: string;
    start_date?: string;
    end_date?: string;
  }) =>
    apiRequest(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    apiRequest(`/items/${id}`, {
      method: 'DELETE',
    }),
};

export const messages = {
  getAll: () => apiRequest('/messages'),

  getUserMessages: (userId: number) => apiRequest(`/messages/user/${userId}`),

  create: (data: {
    sender_id: number;
    receiver_id: number;
    item_id?: number;
    content: string;
  }) =>
    apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const users = {
  getById: (id: number) => apiRequest(`/users/${id}`),
};

