import {
  getMyCommunities,
  sendCommunityMessage,
  subscribeToCommunity,
} from "../services/chat";

describe("chat service (mock)", () => {
  it("returns communities with a last message", async () => {
    const communities = await getMyCommunities();
    expect(communities.length).toBeGreaterThan(0);
    expect(communities[0]).toHaveProperty("name");
  });

  it("notifies subscribers until they unsubscribe", async () => {
    const received: string[] = [];
    const unsubscribe = subscribeToCommunity("c1", (m) =>
      received.push(m.content)
    );

    await sendCommunityMessage("c1", { id: "7", name: "Bryn" }, "first");
    unsubscribe();
    await sendCommunityMessage("c1", { id: "7", name: "Bryn" }, "second");

    expect(received).toContain("first");
    expect(received).not.toContain("second");
  });
});