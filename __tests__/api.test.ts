import { apiRequest, auth, BASE_URL } from "../services/api";

const mockFetch = jest.fn();

beforeEach(() => {
  mockFetch.mockReset();
  (globalThis as any).fetch = mockFetch;
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => body,
  };
}

describe("apiRequest", () => {
  it("returns parsed JSON and calls the right URL", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ hello: "world" }));

    const result = await apiRequest("/items");

    expect(result).toEqual({ hello: "world" });
    expect(mockFetch).toHaveBeenCalledWith(
      `${BASE_URL}/items`,
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("throws the server's error message on a failed response", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Invalid email or password" }, { ok: false, status: 401, statusText: "Unauthorized" })
    );

    await expect(apiRequest("/auth/login")).rejects.toThrow("Invalid email or password");
  });

  it("falls back to the HTTP status when the error body isn't JSON", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(apiRequest("/items")).rejects.toThrow("HTTP 500: Internal Server Error");
  });

  it("rethrows network failures", async () => {
    mockFetch.mockRejectedValue(new Error("Network request failed"));

    await expect(apiRequest("/items")).rejects.toThrow("Network request failed");
  });
});

describe("auth", () => {
  it("login POSTs the email and password as JSON", async () => {
    mockFetch.mockResolvedValue(jsonResponse({ user_id: 7 }));

    await auth.login("bryn@example.com", "secret123");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/auth/login`);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      email: "bryn@example.com",
      password: "secret123",
    });
  });

  it("signup POSTs email, password and name", async () => {
    mockFetch.mockResolvedValue(jsonResponse({}));

    await auth.signup("bryn@example.com", "secret123", "Bryn");

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/auth/signup`);
    expect(JSON.parse(options.body)).toEqual({
      email: "bryn@example.com",
      password: "secret123",
      name: "Bryn",
    });
  });
});