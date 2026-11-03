export type CommunityRole = "owner" | "admin" | "member";

const roleRanks: Record<CommunityRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

export function communityRoleRank(role: CommunityRole): number {
  return roleRanks[role];
}

export function communityRoleLabel(role: CommunityRole): string | null {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return null;
}

export function canLeaveCommunity(role: CommunityRole | null | undefined): boolean {
  return role !== "owner";
}