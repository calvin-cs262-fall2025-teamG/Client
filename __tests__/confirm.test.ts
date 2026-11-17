import { Alert, Platform, type AlertButton } from "react-native";
import { confirm, notify } from "../utils/confirm";

const setPlatform = (os: typeof Platform.OS) => jest.replaceProperty(Platform, "OS", os);

// The last buttons passed to Alert.alert.
const lastButtons = (alert: jest.SpyInstance): AlertButton[] =>
  alert.mock.calls[alert.mock.calls.length - 1][2];

afterEach(() => {
  jest.restoreAllMocks();
});

describe.each(["ios", "android"] as const)("on %s", (os) => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    setPlatform(os);
    alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
  });

  it("confirm shows Cancel and the confirm button, and resolves true on confirm", async () => {
    const result = confirm("Delete item?", "This can't be undone.", {
      confirmText: "Delete",
      destructive: true,
    });

    expect(alert).toHaveBeenCalledWith("Delete item?", "This can't be undone.", [
      expect.objectContaining({ text: "Cancel", style: "cancel" }),
      expect.objectContaining({ text: "Delete", style: "destructive" }),
    ]);
    lastButtons(alert)[1].onPress?.();
    await expect(result).resolves.toBe(true);
  });

  it("confirm resolves false on Cancel", async () => {
    const result = confirm("Sign out?");

    lastButtons(alert)[0].onPress?.();
    await expect(result).resolves.toBe(false);
  });

  it("confirm uses OK and a default style when no options are given", () => {
    void confirm("Continue?");

    expect(lastButtons(alert)[1]).toEqual(expect.objectContaining({ text: "OK", style: "default" }));
  });

  it("notify shows an OK button and resolves once it is pressed", async () => {
    let settled = false;
    const result = notify("Saved", "All done.").then(() => {
      settled = true;
    });

    expect(alert).toHaveBeenCalledWith("Saved", "All done.", [
      expect.objectContaining({ text: "OK" }),
    ]);
    await Promise.resolve();
    expect(settled).toBe(false);

    lastButtons(alert)[0].onPress?.();
    await result;
    expect(settled).toBe(true);
  });
});

describe("on web", () => {
  let alert: jest.SpyInstance;

  beforeEach(() => {
    setPlatform("web");
    alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    window.confirm = jest.fn();
    window.alert = jest.fn();
  });

  it("confirm uses window.confirm with the title and message, and resolves true when accepted", async () => {
    (window.confirm as jest.Mock).mockReturnValue(true);

    await expect(confirm("Leave community?", "You'll stop seeing messages.")).resolves.toBe(true);
    expect(window.confirm).toHaveBeenCalledWith("Leave community?\n\nYou'll stop seeing messages.");
    expect(alert).not.toHaveBeenCalled();
  });

  it("confirm resolves false when the browser dialog is cancelled", async () => {
    (window.confirm as jest.Mock).mockReturnValue(false);

    await expect(confirm("Sign out?")).resolves.toBe(false);
    expect(window.confirm).toHaveBeenCalledWith("Sign out?");
  });

  it("notify uses window.alert", async () => {
    await notify("Error", "Could not save.");

    expect(window.alert).toHaveBeenCalledWith("Error\n\nCould not save.");
    expect(alert).not.toHaveBeenCalled();
  });

  it("notify with only a title shows just the title", async () => {
    await notify("Saved");

    expect(window.alert).toHaveBeenCalledWith("Saved");
  });
});
