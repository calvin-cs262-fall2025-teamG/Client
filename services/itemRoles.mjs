export function getItemRole(ownerId, viewerId) {
  if (viewerId == null) return "guest";
  return ownerId === viewerId ? "owner" : "neighbor";
}

export function canEditItem(ownerId, viewerId) {
  return getItemRole(ownerId, viewerId) === "owner";
}

export function canBookmarkItem(ownerId, viewerId) {
  return getItemRole(ownerId, viewerId) !== "owner";
}

export function canRequestBorrow(ownerId, viewerId, status) {
  return getItemRole(ownerId, viewerId) === "neighbor" && status === "available";
}