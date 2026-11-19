import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { goBack } from "../../utils/navigation";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useBorrowing } from "../../context/BorrowingContext";
import { useCommunities } from "../../context/CommunityContext";
import { useItems } from "../../context/ItemsContext";
import { useProfile } from "../../context/ProfileContext";
import {
  formatDate,
  historyForRequest,
  requestStage,
} from "../../services/borrowingStatus";
import {
  communities as communitiesApi,
  items as itemsApi,
  type Item,
} from "../../services/supabase_service";

const ORANGE = "#E8792F";
const BROWN = "#3b1b0d";
const MUTED = "#7c5f52";
const CREAM = "#FBEBD9";
const GREEN = "#2f7d4f";
const GREEN_BG = "#e4f4e9";

type Step = { key: string; label: string; detail: string; done: boolean };

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const requestId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();
  const { myRequests, incomingRequests, borrowingHistory, refresh } =
    useBorrowing();
  const { myItems } = useItems();
  const { profilesById, getProfile } = useProfile();
  const { myCommunities } = useCommunities();

  const request = [...myRequests, ...incomingRequests].find(
    (r) => r.id === requestId,
  );
  const itemId = request?.item_id;
  const ownItem = myItems.find((i) => i.id === itemId);

  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  // Until the first refresh finishes, a missing request may just not be loaded yet
  const [refreshed, setRefreshed] = useState(false);

  // The status can change on the other person's device, so load fresh data
  useEffect(() => {
    let active = true;
    refresh()
      .catch((e) => console.error("Failed to refresh requests:", e))
      .finally(() => {
        if (active) setRefreshed(true);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  // Items you asked for aren't in myItems, so load them
  const needItem = !!itemId && !ownItem;
  useEffect(() => {
    if (!needItem || !itemId) return;
    let active = true;
    Promise.resolve(itemsApi.getById(itemId))
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setFetchedItem(data ?? null);
      })
      .catch((e) => console.error("Failed to load item:", e));
    return () => {
      active = false;
    };
  }, [needItem, itemId]);

  // Show the first community the item is shared in, by name
  const communityKey = myCommunities.map((c) => `${c.id}:${c.name}`).join("|");
  useEffect(() => {
    if (!itemId) return;
    let active = true;
    (async () => {
      const { data: ids, error } = await itemsApi.getCommunityIds(itemId);
      if (error) throw error;
      const firstId = ids?.[0];
      if (!firstId) return;
      const known = communityKey
        .split("|")
        .find((entry) => entry.startsWith(`${firstId}:`));
      if (known) {
        if (active) setCommunityName(known.slice(firstId.length + 1));
        return;
      }
      const { data: community, error: communityError } =
        await communitiesApi.getById(firstId);
      if (communityError) throw communityError;
      if (active) setCommunityName(community?.name ?? null);
    })().catch((e) => console.error("Failed to load community:", e));
    return () => {
      active = false;
    };
  }, [itemId, communityKey]);

  const item = ownItem ?? fetchedItem;
  const lenderId = item?.owner_id;
  const borrowerId = request?.requester_id;
  const isLender = !!user?.id && !!request && request.requester_id !== user.id;

  useEffect(() => {
    if (lenderId && lenderId !== user?.id) void getProfile(lenderId);
    if (borrowerId && borrowerId !== user?.id) void getProfile(borrowerId);
  }, [lenderId, borrowerId, user?.id, getProfile]);

  const header = (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => goBack(router)}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={24} color={BROWN} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Request</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (!request) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {header}
        <View style={styles.centered}>
          {refreshed ? (
            <Text style={styles.muted}>We couldn&apos;t find this request.</Text>
          ) : (
            <ActivityIndicator size="large" color={ORANGE} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  const nameOf = (userId: string | undefined) =>
    (userId && profilesById[userId]?.display_name) || "Neighbor";
  const lenderName = isLender ? "You" : nameOf(lenderId);
  const borrowerName = isLender ? nameOf(borrowerId) : "You";
  const otherId = isLender ? borrowerId : lenderId;
  const otherName = isLender ? borrowerName : lenderName;

  const stage = requestStage(request, borrowingHistory);
  const history = historyForRequest(request.id, borrowingHistory);
  const approved = request.status === "approved";

  const statusLine: Record<typeof stage, string> = {
    pending: isLender
      ? `${borrowerName} is waiting for you to respond`
      : `Waiting for ${lenderName} to respond`,
    out: "",
    returned: history?.returned_at
      ? `Returned ${formatDate(history.returned_at)}`
      : "Returned",
    declined: isLender
      ? "You declined this request"
      : `${lenderName} declined this request`,
    cancelled: isLender
      ? `${borrowerName} cancelled this request`
      : "You cancelled this request",
  };

  const steps: Step[] = [
    {
      key: "requested",
      label: "Requested",
      detail: formatDate(request.requested_at),
      done: true,
    },
  ];
  if (request.status === "declined" || request.status === "cancelled") {
    steps.push({
      key: "decided",
      label: request.status === "declined" ? "Declined" : "Cancelled",
      detail: request.decided_at ? formatDate(request.decided_at) : "",
      done: true,
    });
  } else {
    steps.push({
      key: "approved",
      label: "Approved",
      detail:
        approved && request.decided_at
          ? formatDate(request.decided_at)
          : isLender
            ? "Waiting for you"
            : `Waiting for ${lenderName}`,
      done: approved,
    });
    steps.push({
      key: "returned",
      label: "Returned",
      detail: history?.returned_at
        ? formatDate(history.returned_at)
        : isLender
          ? "You mark this"
          : `${lenderName} marks this`,
      done: !!history?.returned_at,
    });
  }

  const openThread = () => {
    if (!otherId) return;
    router.push({
      pathname: "/chat-thread",
      params: {
        id: otherId,
        name: otherName,
        itemId: request.item_id,
      },
    });
  };

  const messageButton = (
    <TouchableOpacity
      style={[styles.messageButton, !otherId && styles.disabled]}
      onPress={openThread}
      disabled={!otherId}
      accessibilityRole="button"
      accessibilityState={{ disabled: !otherId }}
    >
      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
      <Text style={styles.messageButtonText}>Message {otherName}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {header}
      <ScrollView contentContainerStyle={styles.container}>
        {stage === "out" ? (
          <View style={styles.banner} testID="approved-banner">
            <Ionicons name="checkmark-circle" size={24} color={GREEN} />
            <Text style={styles.bannerText}>{lenderName} said yes!</Text>
          </View>
        ) : (
          <Text style={styles.statusLine} testID="status-line">
            {statusLine[stage]}
          </Text>
        )}

        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => item && router.push(`/item/${item.id}`)}
          disabled={!item}
          accessibilityRole="button"
          accessibilityLabel={item ? `Open ${item.name}` : "Item"}
        >
          <View style={styles.itemThumb}>
            <Ionicons name="cube-outline" size={28} color={ORANGE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item?.name ?? "Item"}</Text>
            <Text style={styles.itemMeta}>
              {isLender ? "Your item" : `From ${lenderName}`}
            </Text>
            {communityName && (
              <View style={styles.communityRow}>
                <Ionicons name="people-outline" size={13} color={MUTED} />
                <Text style={styles.itemMeta}>{communityName}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={MUTED} />
        </TouchableOpacity>

        {stage === "out" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Next: arrange pickup</Text>
            <Text style={styles.cardBody}>
              Agree on a time and place with {otherName}.
            </Text>
            {messageButton}
          </View>
        ) : (
          messageButton
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          {steps.map((step) => (
            <View key={step.key} style={styles.stepRow} testID={`step-${step.key}`}>
              <Ionicons
                name={step.done ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={step.done ? ORANGE : "#c9b6a8"}
              />
              <Text style={[styles.stepLabel, !step.done && styles.stepPending]}>
                {step.label}
              </Text>
              <Text style={styles.stepDetail}>{step.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={MUTED} />
          <Text style={styles.noteText}>
            Hey, Neighbor! doesn&apos;t cover damage or loss. Talk with{" "}
            {otherName} about how to handle anything that comes up.
          </Text>
        </View>
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
    borderBottomWidth: 1,
    borderBottomColor: "#f1e4d8",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: BROWN },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: MUTED, fontSize: 15 },
  container: { padding: 16, paddingBottom: 40, gap: 14 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: GREEN_BG,
    borderRadius: 14,
    padding: 14,
  },
  bannerText: { fontSize: 17, fontWeight: "700", color: GREEN },
  statusLine: { fontSize: 15, fontWeight: "600", color: MUTED },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CREAM,
    borderRadius: 16,
    padding: 12,
  },
  itemThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontSize: 16, fontWeight: "700", color: BROWN },
  itemMeta: { fontSize: 13, color: MUTED, marginTop: 2 },
  communityRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  card: {
    borderWidth: 1,
    borderColor: "#f1e4d8",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: BROWN, marginBottom: 6 },
  cardBody: { fontSize: 14, color: MUTED, marginBottom: 12 },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: ORANGE,
    borderRadius: 12,
    paddingVertical: 12,
  },
  messageButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  stepLabel: { fontSize: 14, fontWeight: "600", color: BROWN, flex: 1 },
  stepPending: { color: MUTED, fontWeight: "500" },
  stepDetail: { fontSize: 13, color: MUTED },
  note: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingHorizontal: 4,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, color: MUTED },
});
