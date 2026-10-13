import { apiRequest, auth, BASE_URL, items, messages, users } from "../services/api";

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

describe("Client endpoint requests", () => {
  const itemData = { name: "Drill", owner_id: 7 };
  const messageData = { sender_id: 7, receiver_id: 9, content: "Hello" };
  const endpointCases: {
    name: string;
    call: () => Promise<unknown>;
    endpoint: string;
    method?: string;
    body?: unknown;
  }[] = [
    {
      name: "auth.signup",
      call: () => auth.signup("bryn@example.com", "secret123", "Bryn"),
      endpoint: "/auth/signup",
      method: "POST",
      body: { email: "bryn@example.com", password: "secret123", name: "Bryn" },
    },
    {
      name: "auth.login",
      call: () => auth.login("bryn@example.com", "secret123"),
      endpoint: "/auth/login",
      method: "POST",
      body: { email: "bryn@example.com", password: "secret123" },
    },
    {
      name: "auth.verifyCode",
      call: () => auth.verifyCode("bryn@example.com", "123456"),
      endpoint: "/auth/verify-code",
      method: "POST",
      body: { email: "bryn@example.com", code: "123456" },
    },
    {
      name: "auth.resendVerification",
      call: () => auth.resendVerification("bryn@example.com"),
      endpoint: "/auth/resend-verification",
      method: "POST",
      body: { email: "bryn@example.com" },
    },
    { name: "items.getAll", call: () => items.getAll(), endpoint: "/items" },
    { name: "items.getById", call: () => items.getById(42), endpoint: "/items/42" },
    {
      name: "items.create",
      call: () => items.create(itemData),
      endpoint: "/items",
      method: "POST",
      body: itemData,
    },
    {
      name: "items.update",
      call: () => items.update(42, { name: "Updated drill" }),
      endpoint: "/items/42",
      method: "PUT",
      body: { name: "Updated drill" },
    },
    {
      name: "items.delete",
      call: () => items.delete(42),
      endpoint: "/items/42",
      method: "DELETE",
    },
    { name: "messages.getAll", call: () => messages.getAll(), endpoint: "/messages" },
    {
      name: "messages.getUserMessages",
      call: () => messages.getUserMessages(7),
      endpoint: "/messages/user/7",
    },
    {
      name: "messages.create",
      call: () => messages.create(messageData),
      endpoint: "/messages",
      method: "POST",
      body: messageData,
    },
    { name: "users.getById", call: () => users.getById(7), endpoint: "/users/7" },
    {
      name: "users.update",
      call: () => users.update(7, { name: "Bryn Updated" }),
      endpoint: "/users/7",
      method: "PUT",
      body: { name: "Bryn Updated" },
    },
  ];

  it.each(endpointCases)("$name sends the expected request", async ({ call, endpoint, method, body }) => {
    const response = { accepted: true };
    mockFetch.mockResolvedValue(jsonResponse(response));

    await expect(call()).resolves.toEqual(response);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}${endpoint}`);
    expect(options.headers).toEqual(expect.objectContaining({ "Content-Type": "application/json" }));
    // GETs must not send a method or body; parse bodies so key order doesn't matter
    expect(options.method).toBe(method);
    expect(options.body === undefined ? undefined : JSON.parse(options.body)).toEqual(body);
  });
});