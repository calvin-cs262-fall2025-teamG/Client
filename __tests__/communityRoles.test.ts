import {
  canLeaveCommunity,
  communityRoleLabel,
  communityRoleRank,
} from "../services/communityRoles";

describe("community roles", () => {
  it("keeps owners first, labels them, and prevents them from leaving", () => {
    expect(communityRoleRank("owner")).toBe(0);
    expect(communityRoleLabel("owner")).toBe("Owner");
    expect(canLeaveCommunity("owner")).toBe(false);
  });

  it("labels admins and allows them to leave", () => {
    expect(communityRoleRank("admin")).toBe(1);
    expect(communityRoleLabel("admin")).toBe("Admin");
    expect(canLeaveCommunity("admin")).toBe(true);
  });

  it("shows members after privileged roles without a badge and allows them to leave", () => {
    expect(communityRoleRank("member")).toBe(2);
    expect(communityRoleLabel("member")).toBeNull();
    expect(canLeaveCommunity("member")).toBe(true);
  });
});