import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "./api";

async function uploadPhoto(
  endpoint: string,
  uri: string,
  statusError: (status: number) => string
): Promise<string> {
  const response = await FileSystem.uploadAsync(`${BASE_URL}${endpoint}`, uri, {
    fieldName: "photo",
    httpMethod: "POST",
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
  });

  if (response.status !== 200) {
    console.error("Upload failed:", response.status, response.body);
    throw new Error(statusError(response.status));
  }

  return (JSON.parse(response.body) as { filename: string }).filename;
}

export function uploadItemPhoto(uri: string): Promise<string> {
  return uploadPhoto("/items/upload", uri, () => "Image upload failed");
}

export function uploadProfilePhoto(userId: number, uri: string): Promise<string> {
  return uploadPhoto(
    `/users/${userId}/profile-picture`,
    uri,
    (status) => `Upload failed: ${status}`
  );
}
