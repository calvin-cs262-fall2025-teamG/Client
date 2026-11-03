export {
  getImageUrl,
  getSignedUrl,
  type ImageBucket,
} from "./supabase_api";

// import Constants from "expo-constants";
// import {
//   CreateItemRequest,
//   CreateMessageRequest,
//   UpdateItemRequest,
//   UpdateUserRequest,
// } from "./apiTypes";
// import type { User } from "./authServices";

// function getHost() {
//   const hostUri =
//     (Constants.expoConfig as any)?.hostUri ??
//     (Constants.manifest2 as any)?.extra?.expoClient?.hostUri;
//   const host = hostUri?.split(":")?.[0];
//   return host || "localhost";
// }

// const USE_DEPLOYED_BACKEND = true; //  true = the Azure-deployed backend instead of local

// export const BASE_URL = USE_DEPLOYED_BACKEND
//   ? "https://bryn-monopoly-service-bpcuabdzg8bkdycb.westus3-01.azurewebsites.net"
//   : `http://${getHost()}:3001`;
// // console.log("BASE_URL:", BASE_URL);

/*
export type ImageBucket =
  | "profile-pictures"
  | "community-images"
  | "item-images";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://bhrqwrzwjcrfalqjlmrn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function getSupabaseHeaders() {
  if (!SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add it to .env.local."
    );
  }

  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  };
}

function encodeObjectPath(objectPath: string) {
  return objectPath.split("/").map(encodeURIComponent).join("/");
}

export async function uploadImage(
  bucket: ImageBucket,
  ownerId: string | number,
  imageUri: string,
  mimeType?: string | null
): Promise<string> {
  const imageResponse = await fetch(imageUri);
  if (!imageResponse.ok) throw new Error("Could not read the selected image.");

  const image = await imageResponse.blob();
  const contentType = mimeType || image.type || "image/jpeg";
  const extension =
    contentType.split("/")[1]?.replace(/[^a-z0-9]/gi, "").toLowerCase() ||
    "jpg";
  const objectPath = `${ownerId}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(),
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: image,
    }
  );

  if (!uploadResponse.ok) {
    throw new Error(
      `Image upload failed: ${uploadResponse.status} ${await uploadResponse.text()}`
    );
  }
  return objectPath;
}

export async function getSignedUrl(
  bucket: ImageBucket,
  objectPath: string
): Promise<string> {
  if (/^https?:\/\//i.test(objectPath)) return objectPath;

  const cacheKey = `${bucket}:${objectPath}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.url;

  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/sign/${bucket}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        ...getSupabaseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: SIGNED_URL_EXPIRY_SECONDS }),
    }
  );

  if (!response.ok) {
    throw new Error(`Could not sign image URL: ${response.status} ${await response.text()}`);
  }

  const { signedURL, signedUrl } = (await response.json()) as {
    signedURL?: string;
    signedUrl?: string;
  };
  const signedPath = signedURL ?? signedUrl;
  if (!signedPath) throw new Error("Supabase did not return a signed image URL.");
  const signedImageUrl = /^https?:\/\//i.test(signedPath)
    ? signedPath
    : `${SUPABASE_URL}/storage/v1${signedPath.startsWith("/") ? "" : "/"}${signedPath}`;

  signedUrlCache.set(cacheKey, {
    url: signedImageUrl,
    expiresAt: Date.now() + (SIGNED_URL_EXPIRY_SECONDS - 60) * 1000,
  });
  return signedImageUrl;
}

async function signImagePath(
  bucket: ImageBucket,
  imagePath?: string | null
): Promise<string | null | undefined> {
  if (!imagePath || /^https?:\/\//i.test(imagePath) || !imagePath.includes("/")) {
    return imagePath;
  }

  try {
    return await getSignedUrl(bucket, imagePath);
  } catch (error) {
    console.error(`Could not sign ${bucket} image:`, error);
    return imagePath;
  }
}

async function signItemImage<T extends { image_url?: string | null }>(
  item: T
): Promise<T> {
  const itemWithOwnerImages = item as T & {
    owner_avatar?: string | null;
    owner_profile_picture?: string | null;
    profile_picture?: string | null;
  };

  return {
    ...item,
    image_url: await signImagePath("item-images", item.image_url),
    owner_avatar: await signImagePath(
      "profile-pictures",
      itemWithOwnerImages.owner_avatar
    ),
    owner_profile_picture: await signImagePath(
      "profile-pictures",
      itemWithOwnerImages.owner_profile_picture
    ),
    profile_picture: await signImagePath(
      "profile-pictures",
      itemWithOwnerImages.profile_picture
    ),
  };
}

async function signUserImage(user: User): Promise<User> {
  return {
    ...user,
    profile_picture: await signImagePath(
      "profile-pictures",
      user.profile_picture
    ),
  };
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
*/
// export async function apiRequest<T>(
//   endpoint: string,
//   options?: RequestInit,
// ): Promise<T> {
//   const url = `${BASE_URL}${endpoint}`;

//   try {
//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         "Content-Type": "application/json",
//         ...options?.headers,
//       },
//     });

//     if (!response.ok) {
//       const error = await response.json().catch(() => ({}));
//       throw new Error(
//         error.error || `HTTP ${response.status}: ${response.statusText}`,
//       );
//     }

//     return (await response.json()) as T;
//   } catch (error) {
//     console.error(`API Error (${endpoint}):`, error);
//     throw error;
//   }
// }

// export const auth = {
//   signup: (email: string, password: string, name: string) =>
//     apiRequest("/auth/signup", {
//       method: "POST",
//       body: JSON.stringify({ email, password, name }),
//     }),

//   login: (email: string, password: string) =>
//     apiRequest("/auth/login", {
//       method: "POST",
//       body: JSON.stringify({ email, password }),
//     }),

//   verifyCode: (email: string, code: string) =>
//     apiRequest("/auth/verify-code", {
//       method: "POST",
//       body: JSON.stringify({ email, code }),
//     }),

//   resendVerification: (email: string) =>
//     apiRequest("/auth/resend-verification", {
//       method: "POST",
//       body: JSON.stringify({ email }),
//     }),
// };

/*
export const items = {
  getAll: async () => {
    const data = await apiRequest<
      Array<{ image_url?: string | null } & Record<string, any>>
    >("/items");
    return Promise.all(data.map(signItemImage));
  },

  getById: async (id: number) =>
    signItemImage(
      await apiRequest<{ image_url?: string | null } & Record<string, any>>(
        `/items/${id}`
      )
    ),
*/
// export const items = {
//   getAll: () => apiRequest("/items"),

//   getById: (id: number) => apiRequest(`/items/${id}`),

//   create: (data: CreateItemRequest) =>
//     apiRequest("/items", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),

//   update: (id: number, data: UpdateItemRequest) =>
//     apiRequest(`/items/${id}`, {
//       method: "PUT",
//       body: JSON.stringify(data),
//     }),

//   delete: (id: number) =>
//     apiRequest(`/items/${id}`, {
//       method: "DELETE",
//     }),
// };

// export const messages = {
//   getAll: () => apiRequest("/messages"),

//   getUserMessages: (userId: number) => apiRequest(`/messages/user/${userId}`),

//   create: (data: CreateMessageRequest) =>
//     apiRequest("/messages", {
//       method: "POST",
//       body: JSON.stringify(data),
//     }),
// };

/*
export const users = {
  getById: async (id: number) =>
    signUserImage(await apiRequest<User>(`/users/${id}`)),

  update: async (id: number, data: {
    name?: string;
    profile_picture?: string;
  }) => {
    const user = await apiRequest<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return signUserImage(user);
  },
};
*/
// export const users = {
//   getById: (id: number) => apiRequest<User>(`/users/${id}`),

//   update: (id: number, data: UpdateUserRequest) =>
//     apiRequest<User>(`/users/${id}`, {
//       method: "PUT",
//       body: JSON.stringify(data),
//     }),
// };
