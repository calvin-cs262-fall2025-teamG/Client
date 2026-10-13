import * as FileSystem from "expo-file-system/legacy";
import { BASE_URL } from "../services/api";
import { uploadItemPhoto, uploadProfilePhoto } from "../services/uploads";

jest.mock("expo-file-system/legacy", () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: { MULTIPART: "MULTIPART" },
}));

const mockUploadAsync = jest.mocked(FileSystem.uploadAsync);

beforeEach(() => {
  mockUploadAsync.mockReset();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function uploadResult(status: number, body: string): FileSystem.FileSystemUploadResult {
  return { status, body, headers: {}, mimeType: null };
}

describe("photo uploads", () => {
  it("posts item photos as multipart form data and returns the filename", async () => {
    mockUploadAsync.mockResolvedValue(uploadResult(200, JSON.stringify({ filename: "drill.jpg" })));

    await expect(uploadItemPhoto("file:///drill.jpg")).resolves.toBe("drill.jpg");

    expect(mockUploadAsync).toHaveBeenCalledWith(
      `${BASE_URL}/items/upload`,
      "file:///drill.jpg",
      {
        fieldName: "photo",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      }
    );
  });

  it("posts profile photos to the selected user's upload endpoint", async () => {
    mockUploadAsync.mockResolvedValue(uploadResult(200, JSON.stringify({ filename: "profile.jpg" })));

    await expect(uploadProfilePhoto(7, "file:///profile.jpg")).resolves.toBe("profile.jpg");

    expect(mockUploadAsync).toHaveBeenCalledWith(
      `${BASE_URL}/users/7/profile-picture`,
      "file:///profile.jpg",
      {
        fieldName: "photo",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      }
    );
  });

  it("rejects a failed item photo upload", async () => {
    mockUploadAsync.mockResolvedValue(uploadResult(500, "Server error"));

    await expect(uploadItemPhoto("file:///drill.jpg")).rejects.toThrow("Image upload failed");
  });

  it("includes the HTTP status when a profile photo upload fails", async () => {
    mockUploadAsync.mockResolvedValue(uploadResult(413, "File too large"));

    await expect(uploadProfilePhoto(7, "file:///profile.jpg")).rejects.toThrow(
      "Upload failed: 413"
    );
  });
});
