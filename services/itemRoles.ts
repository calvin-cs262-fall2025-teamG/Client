export type ItemRole = "owner" | "neighbor" | "guest";
type UserId = string | number;

export function getItemRole(
  ownerId: UserId,
  viewerId: UserId | null | undefined,
): ItemRole {
  if (viewerId == null) return "guest";
  return ownerId === viewerId ? "owner" : "neighbor";
}

export function canEditItem(
  ownerId: UserId,
  viewerId: UserId | null | undefined,
) {
  return getItemRole(ownerId, viewerId) === "owner";
}

export function canBookmarkItem(
  ownerId: UserId,
  viewerId: UserId | null | undefined,
) {
  return getItemRole(ownerId, viewerId) !== "owner";
}

export function canRequestBorrow(
  ownerId: UserId,
  viewerId: UserId | null | undefined,
  status: string | null | undefined,
) {
  return getItemRole(ownerId, viewerId) === "neighbor" && status === "available";
}