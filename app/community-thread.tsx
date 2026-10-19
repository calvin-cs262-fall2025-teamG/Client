import React, { useEffect, useState } from "react";
import {
    View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
    KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { community_messages, profiles, type CommunityMessage } from "../services/supabase_api";
import { loadLastRead, saveLastRead } from "../services/readState";

export default function CommunityThread() {
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
    const { user } = useAuth();
    const router = useRouter();
    const myId = user?.id ?? "";

    // Newest first, which is what the inverted list wants
    const [messages, setMessages] = useState<CommunityMessage[]>([]);
    const [senderNames, setSenderNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState("");

    useEffect(() => {
        if (!id) return;
        let active = true;

        const load = async () => {
            const { data, error } = await community_messages.getByCommunity(id);
            if (error) throw error;
            const rows = data ?? [];
            if (active) setMessages(rows);

            const senderIds = [...new Set(rows.map((m) => m.sender_id))];
            const names: Record<string, string> = {};
            await Promise.all(
                senderIds.map(async (senderId) => {
                    const { data: profile } = await profiles.getById(senderId);
                    if (profile) names[senderId] = profile.display_name;
                })
            );
            if (active) setSenderNames(names);
        };

        load()
            .catch((e) => console.error("Failed to load community messages:", e))
            .finally(() => active && setLoading(false));

        return () => {
            active = false;
        };
    }, [id]);

    // Record the newest message on screen as seen, on load and after sending.
    const newest = messages[0]?.created_at;
    useEffect(() => {
        if (!id || !myId || !newest) return;
        const key = `community:${id}`;
        loadLastRead(myId)
            .then((map) => saveLastRead(myId, { ...map, [key]: newest }))
            .catch((e) => console.error("Failed to save read state:", e));
    }, [id, myId, newest]);

    const handleSend = async () => {
        const content = text.trim();
        if (!content || !id || !user) return;
        setText("");
        try {
            const { data, error } = await community_messages.create({ community_id: id, content });
            if (error) throw error;
            if (data) {
                setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]));
            }
        } catch (e) {
            console.error("Failed to send message:", e);
            setText(content);
        }
    };

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const renderMessage = ({ item }: { item: CommunityMessage }) => {
        const mine = item.sender_id === myId;
        return (
            <View style={[styles.row, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                    {!mine && (
                        <Text style={styles.sender}>{senderNames[item.sender_id] ?? "Neighbor"}</Text>
                    )}
                    <Text style={mine ? styles.textMine : styles.textTheirs}>{item.content}</Text>
                    <Text style={mine ? styles.timeMine : styles.timeTheirs}>
                        {formatTime(item.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
            <Stack.Screen
                options={{
                    headerTitle: () => (
                        <TouchableOpacity
                            style={styles.headerTitle}
                            onPress={() =>
                                router.push({ pathname: "/community-info", params: { id, name } })
                            }
                        >
                            <View style={styles.headerAvatar}>
                                <Ionicons name="people" size={16} color="#fff" />
                            </View>
                            <Text style={styles.headerName} numberOfLines={1}>
                                {name ?? "Community"}
                            </Text>
                            <Ionicons name="chevron-forward" size={14} color="#9ca3af" />
                        </TouchableOpacity>
                    ),
                }}
            />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={90}
            >
                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#3b1b0d" />
                    </View>
                ) : (
                    <FlatList
                        style={styles.flex}
                        data={messages}
                        inverted
                        keyExtractor={(m) => m.id}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <Text style={styles.empty}>No messages yet. Say hi to your neighbors!</Text>
                        }
                    />
                )}

                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Message your community"
                        placeholderTextColor="#9ca3af"
                        value={text}
                        onChangeText={setText}
                        multiline
                    />
                    <TouchableOpacity
                        accessibilityLabel="Send message"
                        style={[styles.sendButton, !text.trim() && styles.sendDisabled]}
                        onPress={handleSend}
                        disabled={!text.trim()}
                    >
                        <Ionicons name="send" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: "#f9fafb" },
    flex: { flex: 1 },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    listContent: { paddingHorizontal: 12, paddingVertical: 8 },
    empty: { textAlign: "center", color: "#9ca3af", marginTop: 40, transform: [{ scaleY: -1 }] },

    row: { flexDirection: "row", marginVertical: 3 },
    rowMine: { justifyContent: "flex-end" },
    rowTheirs: { justifyContent: "flex-start" },
    bubble: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
    bubbleMine: { backgroundColor: "#3b1b0d" },
    bubbleTheirs: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },
    sender: { fontSize: 12, fontWeight: "700", color: "#3b1b0d", marginBottom: 2 },
    textMine: { color: "#fff", fontSize: 15 },
    textTheirs: { color: "#111827", fontSize: 15 },
    timeMine: { color: "#d1d5db", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },
    timeTheirs: { color: "#9ca3af", fontSize: 10, marginTop: 4, alignSelf: "flex-end" },

    inputBar: {
        flexDirection: "row", alignItems: "flex-end", padding: 8,
        backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb",
    },
    input: {
        flex: 1, maxHeight: 100, backgroundColor: "#f3f4f6", borderRadius: 20,
        paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, color: "#111827",
    },
    sendButton: {
        marginLeft: 8, width: 38, height: 38, borderRadius: 19,
        backgroundColor: "#3b1b0d", justifyContent: "center", alignItems: "center",
    },
    sendDisabled: { opacity: 0.4 },

    headerTitle: { flexDirection: "row", alignItems: "center", maxWidth: 240 },
    headerAvatar: {
        width: 30, height: 30, borderRadius: 15, backgroundColor: "#3b1b0d",
        justifyContent: "center", alignItems: "center", marginRight: 8,
    },
    headerName: { fontSize: 17, fontWeight: "700", color: "#3b1b0d", flexShrink: 1 },
});