import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../context/DatabaseContext";
import { parseTimestamp } from "../services/readState";
import {
  items as itemsApi,
  type BorrowingRequest,
} from "../services/supabase_api";

const HISTORY_LIMIT = 10;

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
};

const formatDate = (iso: string) =>
  new Date(parseTimestamp(iso)).toLocaleDateString();

export default function Requests() {
  const router = useRouter();
  const {
    myItems,
    myRequests,
    incomingRequests,
    borrowingHistory,
    profilesById,
    getProfile,
    refresh,
    approveRequest,
    declineRequest,
    cancelRequest,
    markReturned,
  } = useDatabase();

  // Names of items you asked to borrow; your own come from myItems
  const [otherItemNames, setOtherItemNames] = useState<Record<string, string>>(
    {},
  );
  // The request whose action is running; all buttons wait for it
  const [busyId, setBusyId] = useState<string | null>(null);

  // New requests and cancellations come from other people, so load fresh data
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const pendingIncoming = incomingRequests.filter((r) => r.status === "pending");
  const openRequestIds = new Set(
    borrowingHistory.filter((h) => !h.returned_at).map((h) => h.request_id),
  );
  const outNow = incomingRequests.filter(
    (r) => r.status === "approved" && openRequestIds.has(r.id),
  );
  const history = [...borrowingHistory]
    .sort((a, b) => parseTimestamp(b.borrowed_at) - parseTimestamp(a.borrowed_at))
    .slice(0, HISTORY_LIMIT);

  const requestsById: Record<string, BorrowingRequest> = {};
  [...myRequests, ...incomingRequests].forEach((r) => {
    requestsById[r.id] = r;
  });

  // getProfile caches into profilesById, which re-renders this screen
  const requesterKey = [...new Set(incomingRequests.map((r) => r.requester_id))]
    .sort()
    .join(",");
  useEffect(() => {
    if (!requesterKey) return;
    requesterKey.split(",").forEach((id) => void getProfile(id));
  }, [requesterKey, getProfile]);

  const otherItemKey = [...new Set(myRequests.map((r) => r.item_id))]
    .filter((id) => !myItems.some((i) => i.id === id))
    .sort()
    .join(",");
  useEffect(() => {
    if (!otherItemKey) return;
    let cancelled = false;

    Promise.all(
      otherItemKey.split(",").map(async (id) => {
        const { data, error } = await itemsApi.getById(id);
        if (error) throw error;
        return [id, data?.name] as const;
      }),
    )
      .then((pairs) => {
        if (cancelled) return;
        const names: Record<string, string> = {};
        pairs.forEach(([id, name]) => {
          if (name) names[id] = name;
        });
        setOtherItemNames(names);
      })
      .catch((e) => console.error("Failed to load item names:", e));

    return () => {
      cancelled = true;
    };
  }, [otherItemKey]);

  const itemName = (itemId: string) =>
    myItems.find((i) => i.id === itemId)?.name ??
    otherItemNames[itemId] ??
    "Item";
  const personName = (userId: string) =>
    profilesById[userId]?.display_name ?? "Neighbor";

  const run = async (
    requestId: string,
    action: (id: string) => Promise<void>,
    failMessage: string,
  ) => {
    setBusyId(requestId);
    try {
      // The context updates its lists after each of these succeeds
      await action(requestId);
    } catch (error) {
      console.error(failMessage, error);
      Alert.alert("Something went wrong", failMessage);
    } finally {
      setBusyId(null);
    }
  };

  const busy = busyId !== null;
  const isEmpty =
    pendingIncoming.length === 0 &&
    outNow.length === 0 &&
    myRequests.length === 0 &&
    history.length === 0;

  const actionButton = (
    label: string,
    onPress: () => void,
    variant: "primary" | "secondary",
  ) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        busy && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy }}
    >
      <Text
        style={
          variant === "primary" ? styles.primaryText : styles.secondaryText
        }
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Back button header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {isEmpty && (
          <View style={styles.emptyContainer}>
            <Ionicons name="swap-horizontal" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No requests yet</Text>
            <Text style={styles.emptySub}>
              Borrow requests for your items and the ones you send will show
              up here.
            </Text>
          </View>
        )}

        {pendingIncoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Requests for your items</Text>
            {pendingIncoming.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
                <Text style={styles.meta}>
                  {personName(r.requester_id)} wants to borrow this
                </Text>
                <View style={styles.buttonRow}>
                  {actionButton(
                    "Approve",
                    () =>
                      run(
                        r.id,
                        approveRequest,
                        "Could not approve the request. Please try again.",
                      ),
                    "primary",
                  )}
                  {actionButton(
                    "Decline",
                    () =>
                      run(
                        r.id,
                        declineRequest,
                        "Could not decline the request. Please try again.",
                      ),
                    "secondary",
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {outNow.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Out now</Text>
            {outNow.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
                <Text style={styles.meta}>
                  Borrowed by {personName(r.requester_id)}
                </Text>
                <View style={styles.buttonRow}>
                  {actionButton(
                    "Mark returned",
                    () =>
                      run(
                        r.id,
                        markReturned,
                        "Could not mark the item returned. Please try again.",
                      ),
                    "primary",
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {myRequests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your requests</Text>
            {myRequests.map((r) => (
              <View key={r.id} style={styles.card}>
                <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
                <Text style={styles.meta}>
                  {REQUEST_STATUS_LABELS[r.status] ?? r.status} · Sent{" "}
                  {formatDate(r.requested_at)}
                </Text>
                {r.status === "pending" && (
                  <View style={styles.buttonRow}>
                    {actionButton(
                      "Cancel",
                      () =>
                        run(
                          r.id,
                          cancelRequest,
                          "Could not cancel the request. Please try again.",
                        ),
                      "secondary",
                    )}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>History</Text>
            {history.map((h) => {
              const request = requestsById[h.request_id];
              const lent = request
                ? incomingRequests.some((r) => r.id === request.id)
                : false;
              return (
                <View key={h.id} style={styles.historyRow}>
                  <Text style={styles.historyName}>
                    {request ? itemName(request.item_id) : "Item"}
                  </Text>
                  <Text style={styles.meta}>
                    {lent && request
                      ? `Lent to ${personName(request.requester_id)}`
                      : "You borrowed this"}
                    {" · "}
                    {formatDate(h.borrowed_at)}
                    {" – "}
                    {h.returned_at ? formatDate(h.returned_at) : "still out"}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
  },
  emptySub: {
    marginTop: 6,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    color: "#6b7280",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#f97316",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryText: {
    color: "#f97316",
    fontWeight: "700",
    fontSize: 14,
  },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  historyName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
});
