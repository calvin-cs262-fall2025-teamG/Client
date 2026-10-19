import React, { useEffect, useState } from "react";
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useDatabase } from "../context/DatabaseContext";
import {
    communities, community_members, profiles,
    type Community, type CommunityMemberRole,
} from "../services/supabase_api";

type Member = {
    user_id: string;
    role: CommunityMemberRole;
    display_name: string;
    avatar_path: string | null;
};

const roleRank: Record<CommunityMemberRole, number> = { owner: 0, admin: 1, member: 2 };

// avatar_path is only shown when it is already a full URL.
const avatarUri = (path: string | null) => (path && /^https?:\/\//i.test(path) ? path : null);

async function loadCommunity(id: string): Promise<{ community: Community; members: Member[] }> {
    const [communityRes, membersRes] = await Promise.all([
        communities.getById(id),
        community_members.getByCommunity(id),
    ]);
    if (communityRes.error) throw communityRes.error;
    if (membersRes.error) throw membersRes.error;
    if (!communityRes.data) throw new Error("Community not found");

    const members = await Promise.all(
        (membersRes.data ?? []).map(async (m): Promise<Member> => {
            const { data: profile } = await profiles.getById(m.user_id);
            return {
                user_id: m.user_id,
                role: m.role as CommunityMemberRole,
                display_name: profile?.display_name ?? "Unknown",
                avatar_path: profile?.avatar_path ?? null,
            };
        })
    );
    members.sort(
        (a, b) =>
            roleRank[a.role] - roleRank[b.role] || a.display_name.localeCompare(b.display_name)
    );
    return { community: communityRes.data, members };
}

export default function CommunityInfo() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const { leaveCommunity } = useDatabase();
    const myId = user?.id ?? "";

    const [details, setDetails] = useState<{ community: Community; members: Member[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !myId) return;
        let active = true;
        loadCommunity(id)
            .then((d) => active && setDetails(d))
            .catch((e) => console.error("Failed to load community:", e))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [id, myId]);

    const myRole = details?.members.find((m) => m.user_id === myId)?.role;

    const handleLeave = () => {
        if (!details) return;
        const { community } = details;
        if (myRole === "owner") {
            Alert.alert(
                "You're the owner",
                "Transfer ownership to another member before leaving this community."
            );
            return;
        }
        Alert.alert("Leave community?", `You'll stop seeing messages in ${community.name}.`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Leave",
                style: "destructive",
                onPress: async () => {
                    try {
                        // Goes through the context so the chat list drops this community too.
                        await leaveCommunity(community.id);
                        router.dismissTo("/chat");
                    } catch (e) {
                        console.error("Failed to leave community:", e);
                        Alert.alert("Couldn't leave", "Please try again.");
                    }
                },
            },
        ]);
    };

    const roleLabel = (role: CommunityMemberRole) =>
        role === "owner" ? "Owner" : role === "admin" ? "Admin" : null;

    if (loading || !details) {
        return (
            <View style={styles.center}>
                <Stack.Screen options={{ title: "Community info" }} />
                {loading ? (
                    <ActivityIndicator size="large" color="#3b1b0d" />
                ) : (
                    <Text style={styles.muted}>Couldn&apos;t load this community.</Text>
                )}
            </View>
        );
    }

    const { community, members } = details;
    const communityAvatar = avatarUri(community.avatar_path);

    const header = (
        <View>
            <View style={styles.hero}>
                {communityAvatar ? (
                    <Image source={{ uri: communityAvatar }} style={styles.heroAvatar} />
                ) : (
                    <View style={[styles.heroAvatar, styles.heroPlaceholder]}>
                        <Ionicons name="people" size={44} color="#fff" />
                    </View>
                )}
                <Text style={styles.heroName}>{community.name}</Text>
                <Text style={styles.muted}>
                    {members.length} {members.length === 1 ? "member" : "members"}
                </Text>
                {community.description ? (
                    <Text style={styles.description}>{community.description}</Text>
                ) : null}
            </View>
            <Text style={styles.sectionHeader}>Members</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Community info" }} />
            <FlatList
                data={members}
                keyExtractor={(m) => m.user_id}
                ListHeaderComponent={header}
                renderItem={({ item, index }) => {
                    const label = roleLabel(item.role);
                    const initial = item.display_name.trim()[0]?.toUpperCase() ?? "?";
                    const memberAvatar = avatarUri(item.avatar_path);
                    return (
                        <View
                            style={[
                                styles.memberRow,
                                index === 0 && styles.memberFirst,
                                index === members.length - 1 && styles.memberLast,
                            ]}
                        >
                            {memberAvatar ? (
                                <Image source={{ uri: memberAvatar }} style={styles.memberAvatar} />
                            ) : (
                                <View style={[styles.memberAvatar, styles.memberPlaceholder]}>
                                    <Text style={styles.memberInitial}>{initial}</Text>
                                </View>
                            )}
                            <Text style={styles.memberName}>
                                {item.display_name}
                                {item.user_id === myId ? " (you)" : ""}
                            </Text>
                            {label && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{label}</Text>
                                </View>
                            )}
                        </View>
                    );
                }}
                ListFooterComponent={
                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeave}>
                        <Ionicons name="exit-outline" size={20} color="#b91c1c" />
                        <Text style={styles.leaveText}>Leave community</Text>
                    </TouchableOpacity>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f2f2f7" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f2f2f7" },

    hero: { alignItems: "center", paddingTop: 24, paddingBottom: 8, paddingHorizontal: 24 },
    heroAvatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
    heroName: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 4 },
    heroPlaceholder: { backgroundColor: "#3b1b0d", justifyContent: "center", alignItems: "center" },
    description: { marginTop: 12, fontSize: 15, color: "#374151", textAlign: "center" },
    muted: { color: "#6b7280", fontSize: 14 },

    sectionHeader: {
        fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase",
        paddingHorizontal: 32, paddingTop: 20, paddingBottom: 8,
    },
    memberRow: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
        paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 16,
        borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
    },
    memberFirst: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    memberLast: { borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderBottomWidth: 0 },

    leaveButton: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        marginHorizontal: 16, marginTop: 24, marginBottom: 40, paddingVertical: 14,
        backgroundColor: "#fff", borderRadius: 12,
    },

    memberAvatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    memberPlaceholder: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
    memberInitial: { fontSize: 18, fontWeight: "800", color: "#6b7280" },
    memberName: { flex: 1, fontSize: 16, color: "#111827" },

    badge: { backgroundColor: "#f3e8e1", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
    badgeText: { fontSize: 12, fontWeight: "700", color: "#3b1b0d" },
    leaveText: { marginLeft: 6, fontSize: 16, fontWeight: "600", color: "#b91c1c" },
});