import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import EditProfile from "../app/edit-profile";

const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn(), back: mockBack }),
}));

const mockUser = {
  id: "me",
  email: "bryn@example.com",
  display_name: "Bryn",
  avatar_path: null,
  created_at: "2026-10-01T09:00:00.123456+00:00",
};
const mockSetUser = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, setUser: mockSetUser }),
}));

const mockUpdateProfile = jest.fn();
jest.mock("../context/DatabaseContext", () => ({
  useDatabase: () => ({
    profile: { id: "me", display_name: "Bryn Lamppa", avatar_path: null },
    updateProfile: mockUpdateProfile,
  }),
}));

let alertSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockUpdateProfile.mockImplementation(async ({ display_name }: { display_name: string }) => ({
    id: "me",
    display_name,
    avatar_path: null,
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

const nameInput = () => screen.getByPlaceholderText("Your name");

it("starts the name as the profile's display name", async () => {
  await render(<EditProfile />);

  expect(nameInput().props.value).toBe("Bryn Lamppa");
});

it("saves the trimmed name, updates the auth user and goes back", async () => {
  await render(<EditProfile />);

  await fireEvent.changeText(nameInput(), "  Bryn L  ");
  await fireEvent.press(screen.getByText("Save"));

  await waitFor(() => expect(mockBack).toHaveBeenCalled());
  expect(mockUpdateProfile).toHaveBeenCalledWith({ display_name: "Bryn L" });
  expect(mockSetUser).toHaveBeenCalledWith({ ...mockUser, display_name: "Bryn L" });
  expect(alertSpy).toHaveBeenCalledWith("Success", "Profile updated!");
});

it("requires a name", async () => {
  await render(<EditProfile />);

  await fireEvent.changeText(nameInput(), "   ");
  await fireEvent.press(screen.getByText("Save"));

  expect(alertSpy).toHaveBeenCalledWith("Name required", "Please enter your name.");
  expect(mockUpdateProfile).not.toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
});

it("shows the error alert and stays when the update fails", async () => {
  mockUpdateProfile.mockRejectedValue(new Error("nope"));
  await render(<EditProfile />);

  await fireEvent.press(screen.getByText("Save"));

  await waitFor(() =>
    expect(alertSpy).toHaveBeenCalledWith("Error", "Failed to update profile. Please try again.")
  );
  expect(mockSetUser).not.toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
});

it("shows Coming soon for the photo button", async () => {
  await render(<EditProfile />);

  await fireEvent.press(screen.getByText("Change profile photo"));

  expect(alertSpy).toHaveBeenCalledWith(
    "Coming soon",
    "Changing your profile photo isn't available yet."
  );
});
