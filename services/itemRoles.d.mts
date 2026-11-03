export type ItemRole = "owner" | "neighbor" | "guest";

export function getItemRole(
  ownerId: number,
  viewerId: number | null | undefined
): ItemRole;
export function canEditItem(
  ownerId: number,
  viewerId: number | null | undefined
): boolean;
export function canBookmarkItem(
  ownerId: number,
  viewerId: number | null | undefined
): boolean;
export function canRequestBorrow(
  ownerId: number,
  viewerId: number | null | undefined,
  status: string | null | undefined
): boolean;