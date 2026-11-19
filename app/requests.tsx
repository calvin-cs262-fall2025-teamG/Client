import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { goBack } from "../utils/navigation";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBorrowing } from "../context/BorrowingContext";
import { useItems } from "../context/ItemsContext";
import { useProfile } from "../context/ProfileContext";
import {
  formatDate,
  historyForRequest,
  newestFirst,
  requestStage,
  STAGE_LABELS,
} from "../services/borrowingStatus";
import { parseTimestamp } from "../services/readState";
import { items as itemsApi } from "../services/supabase_service";
import { confirm, notify } from "../utils/confirm";

const ORANGE = "#E8792F";
const BROWN = "#3b1b0d";
const MUTED = "#7c5f52";
const CREAM = "#FBEBD9";

const HISTORY_LIMIT = 10;

type Tab = "mine" | "asked";

export default function Requests() {
  const router = useRouter();
  const { myItems } = useItems();
  const {
    myRequests,
    incomingRequests,
    borrowingHistory,
    refresh,
    approveRequest,
    declineRequest,
    cancelRequest,
    markReturned,
  } = useBorrowing();
  const { profilesById, getProfile } = useProfile();

  const [tab, setTab] = useState<Tab>("mine");
  // Names of items you asked to borrow; your own come from myItems
  const [otherItemNames, setOtherItemNames] = useState<Record<string, string>>(
    {},
  );
  // The request whose action is running; all buttons wait for it
  const [busyId, setBusyId] = useState<string | null>(null);
  // Shown after you approve, until you leave the screen or close it
  const [showReturnHint, setShowReturnHint] = useState(false);

  // New requests and cancellations come from other people, so load fresh data
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const waiting = incomingRequests
    .filter((r) => r.status === "pending")
    .sort(newestFirst);
  const lentOut = incomingRequests
    .filter((r) => requestStage(r, borrowingHistory) === "out")
    .sort(newestFirst);
  const lentHistory = incomingRequests
    .map((r) => ({ request: r, h: historyForRequest(r.id, borrowingHistory) }))
    .filter(({ h }) => !!h?.returned_at)
    .sort(
      (a, b) =>
        parseTimestamp(b.h!.returned_at!) - parseTimestamp(a.h!.returned_at!),
    )
    .slice(0, HISTORY_LIMIT);
  const asked = [...myRequests].sort(newestFirst);

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
      return true;
    } catch (error) {
      console.error(failMessage, error);
      void notify("Something went wrong", failMessage);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const approve = async (requestId: string) => {
    const ok = await run(
      requestId,
      approveRequest,
      "Could not approve the request. Please try again.",
    );
    if (ok) setShowReturnHint(true);
  };

  const confirmReturned = async (requestId: string, borrower: string) => {
    const yes = await confirm(
      "Mark as returned?",
      `Only do this once ${borrower} has given it back. Neighbors can borrow it again after this.`,
      { confirmText: "Mark returned" },
    );
    if (!yes) return;
    await run(
      requestId,
      markReturned,
      "Could not mark the item returned. Please try again.",
    );
  };

  const openThread = (otherId: string, name: string, itemId: string) =>
    router.push({
      pathname: "/chat-thread",
      params: { id: otherId, name, itemId },
    });

  const busy = busyId !== null;

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
      accessibilityLabel={label}
      accessibilityState={{ disabled: busy }}
    >
      <Text
        style={variant === "primary" ? styles.primaryText : styles.secondaryText}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const tabButton = (value: Tab, label: string) => {
    const selected = tab === value;
    return (
      <TouchableOpacity
        style={[styles.tab, selected && styles.tabSelected]}
        onPress={() => setTab(value)}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const empty = (title: string, sub: string) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="swap-horizontal" size={44} color="#c9b6a8" />
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );

  const forMyItems = (
    <>
      {showReturnHint && (
        <View style={styles.hintCard} testID="return-hint">
          <Ionicons name="bulb-outline" size={18} color={ORANGE} />
          <Text style={styles.hintText}>
            Once it’s back, tap Mark returned so neighbors can borrow it again.
          </Text>
          <TouchableOpacity
            onPress={() => setShowReturnHint(false)}
            accessibilityRole="button"
            accessibilityLabel="Dismiss tip"
          >
            <Ionicons name="close" size={18} color={MUTED} />
          </TouchableOpacity>
        </View>
      )}

      {lentOut.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Lent out</Text>
          {lentOut.map((r) => {
            const borrower = personName(r.requester_id);
            const since =
              historyForRequest(r.id, borrowingHistory)?.borrowed_at ??
              r.decided_at ??
              r.requested_at;
            return (
              <View key={r.id} style={styles.card} testID={`lent-${r.id}`}>
                <View style={styles.cardTop}>
                  <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>Borrowed</Text>
                  </View>
                </View>
                <Text style={styles.meta}>
                  With {borrower} since {formatDate(since)}
                </Text>
                <View style={styles.buttonRow}>
                  {actionButton(
                    `Message ${borrower}`,
                    () => openThread(r.requester_id, borrower, r.item_id),
                    "secondary",
                  )}
                  {actionButton(
                    "Mark returned",
                    () => void confirmReturned(r.id, borrower),
                    "primary",
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      {waiting.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Waiting for you</Text>
          {waiting.map((r) => (
            <View key={r.id} style={styles.card} testID={`waiting-${r.id}`}>
              <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
              <Text style={styles.meta}>
                {personName(r.requester_id)} wants to borrow this ·{" "}
                {formatDate(r.requested_at)}
              </Text>
              <View style={styles.buttonRow}>
                {actionButton(
                  "Decline",
                  () =>
                    void run(
                      r.id,
                      declineRequest,
                      "Could not decline the request. Please try again.",
                    ),
                  "secondary",
                )}
                {actionButton("Approve", () => void approve(r.id), "primary")}
              </View>
            </View>
          ))}
        </>
      )}

      {lentHistory.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>History</Text>
          {lentHistory.map(({ request: r, h }) => (
            <View key={r.id} style={styles.historyRow}>
              <Text style={styles.historyName}>{itemName(r.item_id)}</Text>
              <Text style={styles.meta}>
                Lent to {personName(r.requester_id)} ·{" "}
                {formatDate(h!.borrowed_at)} – {formatDate(h!.returned_at!)}
              </Text>
            </View>
          ))}
        </>
      )}

      {lentOut.length === 0 &&
        waiting.length === 0 &&
        lentHistory.length === 0 &&
        empty(
          "No requests for your items",
          "When a neighbor asks to borrow something of yours, it shows up here.",
        )}
    </>
  );

  const askedFor =
    asked.length === 0
      ? empty(
          "You haven’t asked for anything",
          "Requests you send to neighbors show up here.",
        )
      : asked.map((r) => {
          const stage = requestStage(r, borrowingHistory);
          // The card is a plain View so its action buttons aren't nested in
          // another pressable (that errors on web and can fire both presses)
          return (
            <View key={r.id} style={styles.card} testID={`asked-${r.id}`}>
              <TouchableOpacity
                onPress={() => router.push(`/request/${r.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Open request for ${itemName(r.item_id)}`}
              >
                <View style={styles.cardTop}>
                  <Text style={styles.itemName}>{itemName(r.item_id)}</Text>
                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                </View>
                <Text style={styles.meta}>
                  {STAGE_LABELS[stage]} · Sent {formatDate(r.requested_at)}
                </Text>
              </TouchableOpacity>
              {r.status === "pending" && (
                <View style={styles.buttonRow}>
                  {actionButton(
                    "Cancel",
                    () =>
                      void run(
                        r.id,
                        cancelRequest,
                        "Could not cancel the request. Please try again.",
                      ),
                    "secondary",
                  )}
                </View>
              )}
            </View>
          );
        });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => goBack(router)}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={BROWN} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Requests</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {tabButton("mine", "For my items")}
        {tabButton("asked", "I asked for")}
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {tab === "mine" ? forMyItems : askedFor}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BROWN },
  tabs: {
    flexDirection: "row",
    gap: 22,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1e4d8",
  },
  tab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabSelected: { borderBottomColor: ORANGE },
  tabText: { fontSize: 15, fontWeight: "600", color: MUTED },
  tabTextSelected: { color: BROWN, fontWeight: "700" },
  container: { padding: 16, paddingBottom: 32 },
  emptyContainer: { alignItems: "center", paddingTop: 70, paddingHorizontal: 24 },
  emptyText: { marginTop: 12, fontSize: 17, fontWeight: "600", color: BROWN },
  emptySub: { marginTop: 6, fontSize: 14, color: MUTED, textAlign: "center" },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: BROWN,
    marginTop: 14,
    marginBottom: 8,
  },
  hintCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: CREAM,
    borderRadius: 14,
    padding: 12,
    marginBottom: 4,
  },
  hintText: { flex: 1, fontSize: 13, lineHeight: 18, color: BROWN },
  card: {
    borderWidth: 1,
    borderColor: "#f1e4d8",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemName: { fontSize: 16, fontWeight: "700", color: BROWN, flexShrink: 1 },
  tag: {
    backgroundColor: CREAM,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: { fontSize: 12, fontWeight: "700", color: ORANGE },
  meta: { marginTop: 4, fontSize: 13, color: MUTED },
  buttonRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButton: { backgroundColor: ORANGE },
  secondaryButton: {
    borderWidth: 1,
    borderColor: ORANGE,
    backgroundColor: "#fff",
  },
  buttonDisabled: { opacity: 0.5 },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondaryText: { color: ORANGE, fontWeight: "700", fontSize: 14 },
  historyRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f6ece3",
  },
  historyName: { fontSize: 15, fontWeight: "600", color: BROWN },
});
