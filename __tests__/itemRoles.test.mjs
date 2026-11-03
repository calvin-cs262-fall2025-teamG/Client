import assert from "node:assert/strict";
import test from "node:test";
import {
  canBookmarkItem,
  canEditItem,
  canRequestBorrow,
  getItemRole,
} from "../services/itemRoles.mjs";

const ownerId = 42;

test("owners can edit their listing but cannot bookmark or borrow it", () => {
  assert.equal(getItemRole(ownerId, ownerId), "owner");
  assert.equal(canEditItem(ownerId, ownerId), true);
  assert.equal(canBookmarkItem(ownerId, ownerId), false);
  assert.equal(canRequestBorrow(ownerId, ownerId, "available"), false);
});

test("neighbors can bookmark and request an available listing, but cannot edit it", () => {
  const neighborId = 17;

  assert.equal(getItemRole(ownerId, neighborId), "neighbor");
  assert.equal(canEditItem(ownerId, neighborId), false);
  assert.equal(canBookmarkItem(ownerId, neighborId), true);
  assert.equal(canRequestBorrow(ownerId, neighborId, "available"), true);
});

test("guests can view and bookmark listings but cannot request to borrow", () => {
  assert.equal(getItemRole(ownerId, null), "guest");
  assert.equal(canEditItem(ownerId, null), false);
  assert.equal(canBookmarkItem(ownerId, null), true);
  assert.equal(canRequestBorrow(ownerId, null, "available"), false);
});

test("neighbors cannot request an item that is already borrowed", () => {
  assert.equal(canRequestBorrow(ownerId, 17, "borrowed"), false);
});