import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/(auth)/login";

// The mode lives in the `tab` URL param, and the toggle changes it with
// router.setParams. This small store lets setParams rerender the screen.
let mockTab: string | undefined;
const mockListeners = new Set<() => void>();
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  setParams: jest.fn(({ tab }: { tab?: string }) => {
    mockTab = tab;
    mockListeners.forEach((l) => l());
  }),
};
jest.mock("expo-router", () => {
  const { useSyncExternalStore } = jest.requireActual("react");
  const subscribe = (l: () => void) => {
    mockListeners.add(l);
    return () => mockListeners.delete(l);
  };
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({ tab: useSyncExternalStore(subscribe, () => mockTab) }),
  };
});

const mockLogin = jest.fn();
const mockSignup = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin, signup: mockSignup }),
}));

const nameInput = () => screen.queryByPlaceholderText("Your full name");
const emailInput = () => screen.getByPlaceholderText("you@example.com");

// "Log in" / "Sign up" label both the toggle and, in that mode, the submit button.
// The toggle comes first; the submit button is the last match.
const toggle = (label: "Log in" | "Sign up") => screen.getAllByText(label)[0];
const submit = (label: "Log in" | "Sign up") => {
  const matches = screen.getAllByText(label);
  return matches[matches.length - 1];
};

async function fillLogin(email = "bryn@calvin.edu", password = "secret12") {
  await fireEvent.changeText(emailInput(), email);
  await fireEvent.changeText(screen.getByPlaceholderText("Your password"), password);
}

async function fillSignup(name = "Bryn", email = "new@calvin.edu", password = "secret12") {
  await fireEvent.changeText(nameInput()!, name);
  await fireEvent.changeText(emailInput(), email);
  await fireEvent.changeText(screen.getByPlaceholderText("Create a password"), password);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
  mockTab = undefined;
  mockListeners.clear();
  mockLogin.mockResolvedValue(undefined);
  mockSignup.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("switching between Log in and Sign up", () => {
  it("starts on Sign up, with the name field", async () => {
    await render(<LoginScreen />);

    expect(screen.getByText("Create account")).toBeTruthy();
    expect(nameInput()).toBeTruthy();
  });

  it("opens on Log in when the link asks for it, without the name field", async () => {
    mockTab = "login";
    await render(<LoginScreen />);

    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(nameInput()).toBeNull();
    expect(screen.getByText("Forgot password?")).toBeTruthy();
  });

  it("switches modes with the toggle", async () => {
    await render(<LoginScreen />);

    await fireEvent.press(toggle("Log in"));
    expect(mockRouter.setParams).toHaveBeenCalledWith({ tab: "login" });
    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(nameInput()).toBeNull();

    await fireEvent.press(toggle("Sign up"));
    expect(screen.getByText("Create account")).toBeTruthy();
    expect(nameInput()).toBeTruthy();
  });

  it("clears an error message when switching modes", async () => {
    mockTab = "login";
    mockLogin.mockRejectedValue(new Error("Invalid login credentials"));
    await render(<LoginScreen />);
    await fillLogin();
    await fireEvent.press(submit("Log in"));
    await screen.findByText("Invalid login credentials");

    await fireEvent.press(toggle("Sign up"));

    expect(screen.queryByText("Invalid login credentials")).toBeNull();
  });
});

describe("validation", () => {
  it("does not log in with an empty email or password", async () => {
    mockTab = "login";
    await render(<LoginScreen />);

    await fireEvent.press(submit("Log in"));
    await fireEvent.changeText(emailInput(), "bryn@calvin.edu");
    await fireEvent.press(submit("Log in"));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("does not sign up without a name", async () => {
    await render(<LoginScreen />);

    await fillSignup("   ");
    await fireEvent.press(submit("Sign up"));

    expect(mockSignup).not.toHaveBeenCalled();
  });

  // BUG: there is no email format check. "not-an-email" is sent straight to
  // signup, and the user only finds out from whatever the server says.
  it.skip("shows a message for an invalid email and does not sign up", async () => {
    await render(<LoginScreen />);

    await fillSignup("Bryn", "not-an-email");
    await fireEvent.press(submit("Sign up"));

    expect(mockSignup).not.toHaveBeenCalled();
    expect(screen.getByText(/valid email/i)).toBeTruthy();
  });
});

describe("signing up", () => {
  it("signs up and goes to Verify Email with the address", async () => {
    await render(<LoginScreen />);

    await fillSignup();
    await fireEvent.press(submit("Sign up"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/(auth)/verify-email",
        params: { email: "new@calvin.edu" },
      })
    );
    expect(mockSignup).toHaveBeenCalledWith({
      email: "new@calvin.edu",
      password: "secret12",
      displayName: "Bryn",
    });
  });

  it("shows the error and stays when sign up fails", async () => {
    mockSignup.mockRejectedValue(new Error("User already registered"));
    await render(<LoginScreen />);

    await fillSignup();
    await fireEvent.press(submit("Sign up"));

    expect(await screen.findByText("User already registered")).toBeTruthy();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

describe("logging in", () => {
  beforeEach(() => {
    mockTab = "login";
  });

  it("logs in and goes to the tabs", async () => {
    await render(<LoginScreen />);

    await fillLogin();
    await fireEvent.press(submit("Log in"));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/(tabs)"));
    expect(mockLogin).toHaveBeenCalledWith({ email: "bryn@calvin.edu", password: "secret12" });
  });

  it("goes to Verify Email when the error says the email isn't verified", async () => {
    mockLogin.mockRejectedValue(new Error("Email not verified"));
    await render(<LoginScreen />);

    await fillLogin();
    await fireEvent.press(submit("Log in"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/(auth)/verify-email",
        params: { email: "bryn@calvin.edu" },
      })
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  // BUG: Supabase reports an unverified account as "Email not confirmed"
  // (code "email_not_confirmed"). login.tsx only looks for "not verified",
  // "verification" or "verify" in the message, so the real error is shown as
  // text instead of sending the user to Verify Email.
  it.skip("goes to Verify Email for Supabase's real unverified-email error", async () => {
    mockLogin.mockRejectedValue(
      Object.assign(new Error("Email not confirmed"), { code: "email_not_confirmed" })
    );
    await render(<LoginScreen />);

    await fillLogin();
    await fireEvent.press(submit("Log in"));

    await waitFor(() =>
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: "/(auth)/verify-email",
        params: { email: "bryn@calvin.edu" },
      })
    );
  });

  it("shows other errors and stays on the screen", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid login credentials"));
    await render(<LoginScreen />);

    await fillLogin("bryn@calvin.edu", "wrong");
    await fireEvent.press(submit("Log in"));

    expect(await screen.findByText("Invalid login credentials")).toBeTruthy();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it("shows a fallback message when the error has no text", async () => {
    mockLogin.mockRejectedValue({});
    await render(<LoginScreen />);

    await fillLogin();
    await fireEvent.press(submit("Log in"));

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeTruthy();
  });
});
