import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { supabase } from "../app/utils/supabase";

// A fake supabase client. The real one needs .env and a network.
// services/supabaseAuth is left real, so login/signup/logout go through it.
jest.mock("../app/utils/supabase", () => {
  const single = jest.fn();
  return {
    supabase: {
      auth: {
        getSession: jest.fn(),
        onAuthStateChange: jest.fn(),
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        startAutoRefresh: jest.fn(),
        stopAutoRefresh: jest.fn(),
      },
      from: jest.fn(() => ({
        select: () => ({ eq: () => ({ single }) }),
      })),
      __single: single,
    },
  };
});

const mocked = (fn: unknown) => fn as jest.Mock;
const auth = supabase.auth as unknown as Record<string, jest.Mock>;
const profileQuery = (supabase as unknown as { __single: jest.Mock }).__single;

const session = (id: string, email = `${id}@calvin.edu`) => ({ user: { id, email } });

const profileRow = (id: string, display_name: string) => ({
  id,
  display_name,
  avatar_path: null,
  created_at: "2026-10-01T09:00:00.123456+00:00",
});

// The callback AuthProvider registers with onAuthStateChange
let authListener: (event: string, s: ReturnType<typeof session> | null) => void;
const unsubscribe = jest.fn();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

async function renderAuth() {
  const hook = await renderHook(useAuth, { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  auth.onAuthStateChange.mockImplementation((cb) => {
    authListener = cb;
    return { data: { subscription: { unsubscribe } } };
  });
  auth.signInWithPassword.mockResolvedValue({ data: {}, error: null });
  auth.signUp.mockResolvedValue({ data: {}, error: null });
  auth.signOut.mockResolvedValue({ error: null });
  profileQuery.mockImplementation(async () => ({ data: profileRow("u1", "Bryn"), error: null }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("restoring a session on startup", () => {
  it("sets the user from the saved session and profile", async () => {
    auth.getSession.mockResolvedValue({ data: { session: session("u1") }, error: null });

    const { result } = await renderAuth();

    expect(result.current.user).toEqual({
      id: "u1",
      email: "u1@calvin.edu",
      display_name: "Bryn",
      avatar_path: null,
      created_at: "2026-10-01T09:00:00.123456+00:00",
    });
    expect(supabase.from).toHaveBeenCalledWith("profiles");
  });

  it("leaves the user null when there is no session", async () => {
    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(profileQuery).not.toHaveBeenCalled();
  });

  it("starts with loading true until the session check finishes", async () => {
    let finish!: (v: unknown) => void;
    auth.getSession.mockReturnValue(new Promise((r) => (finish = r)));

    const { result } = await renderHook(useAuth, { wrapper });
    expect(result.current.loading).toBe(true);

    await act(async () => finish({ data: { session: null }, error: null }));
    expect(result.current.loading).toBe(false);
  });

  it("leaves the user null when the profile can't be loaded", async () => {
    auth.getSession.mockResolvedValue({ data: { session: session("u1") }, error: null });
    profileQuery.mockResolvedValue({ data: null, error: { message: "row not found" } });

    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
  });

  it("still finishes loading when restoring the session fails", async () => {
    auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid refresh token" },
    });

    const { result } = await renderAuth();

    expect(result.current.user).toBeNull();
    expect(console.error).toHaveBeenCalledWith("Session restore error:", expect.anything());
  });
});

describe("login", () => {
  it("signs in with the email and password", async () => {
    const { result } = await renderAuth();

    await act(() => result.current.login({ email: "bryn@calvin.edu", password: "secret12" }));

    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: "bryn@calvin.edu",
      password: "secret12",
    });
  });

  it("rejects with the server's error for a wrong password", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: new Error("Invalid login credentials"),
    });
    const { result } = await renderAuth();

    await expect(
      result.current.login({ email: "bryn@calvin.edu", password: "wrong" })
    ).rejects.toThrow("Invalid login credentials");
    expect(result.current.user).toBeNull();
  });

  it("rejects with the email-not-confirmed error for an unverified account", async () => {
    auth.signInWithPassword.mockResolvedValue({
      data: {},
      error: Object.assign(new Error("Email not confirmed"), { code: "email_not_confirmed" }),
    });
    const { result } = await renderAuth();

    await expect(
      result.current.login({ email: "new@calvin.edu", password: "secret12" })
    ).rejects.toMatchObject({ message: "Email not confirmed", code: "email_not_confirmed" });
  });
});

describe("signup", () => {
  it("signs up with the display name and the email redirect", async () => {
    const { result } = await renderAuth();

    await act(() =>
      result.current.signup({ email: "new@calvin.edu", password: "secret12", displayName: "New" })
    );

    expect(auth.signUp).toHaveBeenCalledWith({
      email: "new@calvin.edu",
      password: "secret12",
      options: {
        data: { display_name: "New" },
        emailRedirectTo: "heynbr://auth/callback",
      },
    });
  });

  it("does not sign the user in before the email is verified", async () => {
    const { result } = await renderAuth();

    await act(() =>
      result.current.signup({ email: "new@calvin.edu", password: "secret12", displayName: "New" })
    );

    expect(result.current.user).toBeNull();
  });

  it("rejects with the server's error", async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: new Error("User already registered") });
    const { result } = await renderAuth();

    await expect(
      result.current.signup({ email: "bryn@calvin.edu", password: "secret12", displayName: "Bryn" })
    ).rejects.toThrow("User already registered");
  });
});

describe("signing out and auth state changes", () => {
  it("clears the user after signing out", async () => {
    auth.getSession.mockResolvedValue({ data: { session: session("u1") }, error: null });
    const { result } = await renderAuth();
    expect(result.current.user?.id).toBe("u1");

    await act(() => result.current.logout());
    // Supabase reports the sign-out through the auth listener
    await act(async () => authListener("SIGNED_OUT", null));

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("rejects when signing out fails", async () => {
    auth.signOut.mockResolvedValue({ error: new Error("network down") });
    const { result } = await renderAuth();

    await expect(result.current.logout()).rejects.toThrow("network down");
  });

  it("sets the user when someone signs in", async () => {
    const { result } = await renderAuth();
    profileQuery.mockResolvedValue({ data: profileRow("u2", "Greg"), error: null });

    await act(async () => authListener("SIGNED_IN", session("u2")));

    await waitFor(() => expect(result.current.user?.display_name).toBe("Greg"));
    expect(result.current.user?.id).toBe("u2");
  });

  it("switches to the new user when the session changes", async () => {
    auth.getSession.mockResolvedValue({ data: { session: session("u1") }, error: null });
    const { result } = await renderAuth();
    profileQuery.mockResolvedValue({ data: profileRow("u2", "Greg"), error: null });

    await act(async () => authListener("SIGNED_IN", session("u2")));

    await waitFor(() => expect(result.current.user?.id).toBe("u2"));
  });

  it("removes the auth listener on unmount", async () => {
    const hook = await renderAuth();
    expect(unsubscribe).not.toHaveBeenCalled();

    await hook.unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("ignores auth changes that arrive after unmount", async () => {
    const hook = await renderAuth();
    await hook.unmount();
    profileQuery.mockClear();

    authListener("SIGNED_IN", session("u2"));
    await new Promise((r) => setTimeout(r, 10));

    expect(profileQuery).not.toHaveBeenCalled();
  });
});

describe("token refresh", () => {
  it("stops auto refresh on unmount", async () => {
    const hook = await renderAuth();
    const stopsBefore = mocked(auth.stopAutoRefresh).mock.calls.length;

    await hook.unmount();

    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(stopsBefore + 1);
  });
});

it("throws when useAuth is used outside AuthProvider", async () => {
  await expect(renderHook(useAuth)).rejects.toThrow("useAuth must be used within AuthProvider");
});
