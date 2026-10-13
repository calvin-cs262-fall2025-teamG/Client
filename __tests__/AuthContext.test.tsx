import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { auth } from "../services/api";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("../services/api", () => ({
  auth: { login: jest.fn(), signup: jest.fn() },
}));

const mockedAuth = auth as jest.Mocked<typeof auth>;
const USER_KEY = "@heyneighbor:user";
const bryn = { user_id: 7, email: "bryn@example.com", name: "Bryn", rating: 5, created_at: "2026-01-01" };

const wrapper = ({ children }: { children: React.ReactNode }) => <AuthProvider>{children}</AuthProvider>;

async function renderAuth() {
  const hook = await renderHook(() => useAuth(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("starts signed out when nothing is stored", async () => {
  const { result } = await renderAuth();

  expect(result.current.user).toBeNull();
});

it("restores the saved user on startup", async () => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(bryn));

  const { result } = await renderAuth();

  expect(result.current.user).toEqual(bryn);
});

it("finishes loading even if the stored user is corrupt", async () => {
  await AsyncStorage.setItem(USER_KEY, "{not json");

  const { result } = await renderAuth();

  expect(result.current.user).toBeNull();
});

it("login sets and persists the user", async () => {
  mockedAuth.login.mockResolvedValue({ message: "ok", user: bryn });
  const { result } = await renderAuth();

  await act(() => result.current.login("bryn@example.com", "secret123"));

  expect(mockedAuth.login).toHaveBeenCalledWith("bryn@example.com", "secret123");
  expect(result.current.user).toEqual(bryn);
  expect(JSON.parse((await AsyncStorage.getItem(USER_KEY))!)).toEqual(bryn);
});

it("login propagates errors and stays signed out", async () => {
  mockedAuth.login.mockRejectedValue(new Error("Invalid email or password"));
  const { result } = await renderAuth();

  await expect(
    act(() => result.current.login("bryn@example.com", "wrong"))
  ).rejects.toThrow("Invalid email or password");
  expect(result.current.user).toBeNull();
  expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
});

it("signup returns the response without signing in", async () => {
  const response = { message: "Check your email", user: bryn };
  mockedAuth.signup.mockResolvedValue(response);
  const { result } = await renderAuth();

  let returned: unknown;
  await act(async () => {
    returned = await result.current.signup("bryn@example.com", "secret123", "Bryn");
  });

  expect(returned).toEqual(response);
  expect(result.current.user).toBeNull();
  expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
});

it("logout clears the user and storage", async () => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(bryn));
  const { result } = await renderAuth();

  await act(() => result.current.logout());

  expect(result.current.user).toBeNull();
  expect(await AsyncStorage.getItem(USER_KEY)).toBeNull();
});

it("useAuth throws outside the provider", async () => {
  await expect(renderHook(() => useAuth())).rejects.toThrow(
    "useAuth must be used within AuthProvider"
  );
});
