import type { BorrowingHistory, BorrowingRequest } from "./supabase_service";
import { parseTimestamp } from "./readState";

// Where a request stands, worked out from the request row and its history row.
// "out" means approved and not yet returned.
export type RequestStage = "pending" | "out" | "returned" | "declined" | "cancelled";

export function historyForRequest(
  requestId: string,
  history: BorrowingHistory[],
): BorrowingHistory | undefined {
  return history.find((h) => h.request_id === requestId);
}

export function requestStage(
  request: BorrowingRequest,
  history: BorrowingHistory[],
): RequestStage {
  switch (request.status) {
    case "approved":
      return historyForRequest(request.id, history)?.returned_at ? "returned" : "out";
    case "declined":
      return "declined";
    case "cancelled":
      return "cancelled";
    default:
      return "pending";
  }
}

export const STAGE_LABELS: Record<RequestStage, string> = {
  pending: "Pending",
  out: "Approved · arrange pickup",
  returned: "Returned",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const formatDate = (iso: string) =>
  new Date(parseTimestamp(iso)).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

// The newest request first, so the current one wins when an item was asked for more than once.
export const newestFirst = (a: BorrowingRequest, b: BorrowingRequest) =>
  parseTimestamp(b.requested_at) - parseTimestamp(a.requested_at);
