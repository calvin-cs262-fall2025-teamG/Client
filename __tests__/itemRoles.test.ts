import {
  canBookmarkItem,
  canEditItem,
  canRequestBorrow,
  getItemRole,
} from "../services/itemRoles";

describe("item roles", () => {
  it("allows owners to edit, but not bookmark or borrow, their listing", () => {
    expect(getItemRole("owner-1", "owner-1")).toBe("owner");
    expect(canEditItem("owner-1", "owner-1")).toBe(true);
    expect(canBookmarkItem("owner-1", "owner-1")).toBe(false);
    expect(canRequestBorrow("owner-1", "owner-1", "available")).toBe(false);
  });

  it("allows neighbors to bookmark and request available listings", () => {
    expect(getItemRole("owner-1", "neighbor-1")).toBe("neighbor");
    expect(canEditItem("owner-1", "neighbor-1")).toBe(false);
    expect(canBookmarkItem("owner-1", "neighbor-1")).toBe(true);
    expect(canRequestBorrow("owner-1", "neighbor-1", "available")).toBe(true);
  });

  it("allows guests to bookmark but not request a listing", () => {
    expect(getItemRole("owner-1", null)).toBe("guest");
    expect(canEditItem("owner-1", null)).toBe(false);
    expect(canBookmarkItem("owner-1", null)).toBe(true);
    expect(canRequestBorrow("owner-1", null, "available")).toBe(false);
  });

  it("does not allow neighbors to request borrowed listings", () => {
    expect(canRequestBorrow("owner-1", "neighbor-1", "borrowed")).toBe(false);
  });
});