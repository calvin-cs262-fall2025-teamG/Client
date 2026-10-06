// Mock community chat service

export interface CommunitySummary {
  id: string;
  name: string;
  last_message: { content: string; sender_name: string; created_at: string } | null;
  unread_count: number;
}

export interface CommunityMessage {
  id: string;
  community_id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string | null;
  content: string;
  created_at: string;
}

type Listener = (message: CommunityMessage) => void;

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60000).toISOString();

const communities = [
  { id: "c1", name: "Church Neighbors", unread_count: 2 },
  { id: "c2", name: "KHVR Neighbors", unread_count: 0 },
];

const messagesByCommunity: Record<string, CommunityMessage[]> = {
  c1: [
    { id: "m1", community_id: "c1", sender_id: "u1", sender_name: "Greg", sender_avatar: null, content: "Anyone have a ladder I can borrow this weekend?", created_at: ago(180) },
    { id: "m2", community_id: "c1", sender_id: "u2", sender_name: "Bryn", sender_avatar: null, content: "I do! I'll list it for you.", created_at: ago(150) },
    { id: "m3", community_id: "c1", sender_id: "u3", sender_name: "Jacob", sender_avatar: null, content: "I need a drill for a project I'm working on, anyone?", created_at: ago(20) },
  ],
  c2: [
    { id: "m4", community_id: "c2", sender_id: "u4", sender_name: "Jacob", sender_avatar: null, content: "Welcome to KHVR neighborhood group!", created_at: ago(2000) },
  ],
};

const listeners: Record<string, Set<Listener>> = {};
const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getMyCommunities(): Promise<CommunitySummary[]> {
  await delay();
  return communities.map((c) => {
    const msgs = messagesByCommunity[c.id] ?? [];
    const last = msgs[msgs.length - 1];
    return {
      ...c,
      last_message: last
        ? { content: last.content, sender_name: last.sender_name, created_at: last.created_at }
        : null,
    };
  });
}

export async function getCommunityMessages(communityId: string): Promise<CommunityMessage[]> {
  await delay();
  return [...(messagesByCommunity[communityId] ?? [])];
}

export async function sendCommunityMessage(
  communityId: string,
  sender: { id: string; name: string },
  content: string
): Promise<void> {
  await delay(100);
  const message: CommunityMessage = {
    id: `m${Date.now()}`,
    community_id: communityId,
    sender_id: sender.id,
    sender_name: sender.name,
    sender_avatar: null,
    content,
    created_at: new Date().toISOString(),
  };
  (messagesByCommunity[communityId] ??= []).push(message);
  listeners[communityId]?.forEach((fn) => fn(message));
}

// (Will use Supabase Realtime in the future, but for now this is a mock implementation)
export function subscribeToCommunity(communityId: string, onMessage: Listener): () => void {
  (listeners[communityId] ??= new Set()).add(onMessage);
  return () => listeners[communityId]?.delete(onMessage);
}