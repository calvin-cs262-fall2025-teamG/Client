import { act, renderHook, waitFor } from "@testing-library/react-native";
import { collectResults, replaceById, unwrap, useUserScopedLoad, type Take } from "../context/contextUtils";

const ok = <T>(data: T) => ({ data, error: null });
const fail = (message: string) => ({ data: null, error: { message } });

describe("unwrap", () => {
  it("returns the data when there is no error", () => {
    expect(unwrap(ok({ id: "i1" }))).toEqual({ id: "i1" });
  });

  it("throws the error message", () => {
    expect(() => unwrap(fail("permission denied"))).toThrow("permission denied");
  });

  it("passes null data through when there is no error", () => {
    expect(unwrap(ok(null))).toBeNull();
  });
});

describe("replaceById", () => {
  const list = [
    { id: "a", name: "Drill" },
    { id: "b", name: "Bike" },
  ];

  it("swaps in the row with the same id and keeps the order", () => {
    const next = replaceById(list, { id: "b", name: "Tent" });
    expect(next).toEqual([
      { id: "a", name: "Drill" },
      { id: "b", name: "Tent" },
    ]);
    expect(next).not.toBe(list);
    expect(list[1].name).toBe("Bike");
  });

  it("leaves the list as it was when no id matches", () => {
    expect(replaceById(list, { id: "z", name: "Tent" })).toEqual(list);
  });
});

describe("collectResults", () => {
  it("applies the results that worked and returns the errors in order", () => {
    const setA = jest.fn();
    const setB = jest.fn();
    const setC = jest.fn();

    const failures = collectResults((take) => {
      take(ok(["a"]), setA);
      take(fail("first"), setB);
      take(fail("second"), setC);
    });

    expect(setA).toHaveBeenCalledWith(["a"]);
    expect(setB).not.toHaveBeenCalled();
    expect(setC).not.toHaveBeenCalled();
    expect(failures).toEqual(["first", "second"]);
  });

  it("passes null data to the setter and reports no errors", () => {
    const set = jest.fn();
    expect(collectResults((take) => take(ok(null), set))).toEqual([]);
    expect(set).toHaveBeenCalledWith(null);
  });
});

describe("useUserScopedLoad", () => {
  // Stable functions, as the hook requires
  const fetchAll = jest.fn<Promise<(take: Take) => void>, []>();
  const reset = jest.fn();
  const set = jest.fn();

  const renderLoad = (userId: string | undefined) =>
    renderHook(({ id }: { id: string | undefined }) => useUserScopedLoad(id, fetchAll, reset, "Fallback"), {
      initialProps: { id: userId },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    fetchAll.mockResolvedValue((take) => take(ok("data"), set));
  });

  it("loads on sign-in and applies the results", async () => {
    const { result } = await renderLoad("u1");

    await waitFor(() => expect(set).toHaveBeenCalledWith("data"));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sets the error and stops loading when the load rejects (no network)", async () => {
    fetchAll.mockRejectedValue(new Error("Network request failed"));

    const { result } = await renderLoad("u1");

    await waitFor(() => expect(result.current.error).toBe("Network request failed"));
    expect(result.current.loading).toBe(false);
    expect(set).not.toHaveBeenCalled();
  });

  it("uses the fallback message when the load rejects with a non-Error", async () => {
    fetchAll.mockRejectedValue("offline");

    const { result } = await renderLoad("u1");

    await waitFor(() => expect(result.current.error).toBe("Fallback"));
    expect(result.current.loading).toBe(false);
  });

  it("reports the first failed result as the error", async () => {
    fetchAll.mockResolvedValue((take) => {
      take(fail("first"), set);
      take(fail("second"), set);
    });

    const { result } = await renderLoad("u1");

    await waitFor(() => expect(result.current.error).toBe("first"));
    expect(result.current.loading).toBe(false);
  });

  it("clears the old error when refresh succeeds", async () => {
    fetchAll.mockRejectedValueOnce(new Error("Network request failed"));
    const { result } = await renderLoad("u1");
    await waitFor(() => expect(result.current.error).toBe("Network request failed"));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
    expect(set).toHaveBeenCalledWith("data");
  });

  it("resets instead of loading when signed out", async () => {
    const { result } = await renderLoad(undefined);

    expect(fetchAll).not.toHaveBeenCalled();
    expect(reset).toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });
});
