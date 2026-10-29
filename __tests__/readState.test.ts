import { isUnread, parseTimestamp } from "../services/readState";

jest.mock("@react-native-async-storage/async-storage", () =>
  jest.requireActual("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// The format PostgREST returns for timestamptz
const SEEN = "2026-10-19T12:05:00.123456+00:00";

describe("parseTimestamp", () => {
  it("parses microsecond timestamps to the millisecond", () => {
    expect(parseTimestamp(SEEN)).toBe(Date.UTC(2026, 9, 19, 12, 5, 0, 123));
  });

  it("handles timestamps without more than 3 fractional digits", () => {
    expect(parseTimestamp("2026-10-19T12:05:00.123Z")).toBe(Date.UTC(2026, 9, 19, 12, 5, 0, 123));
    expect(parseTimestamp("2026-10-19T12:05:00+00:00")).toBe(Date.UTC(2026, 9, 19, 12, 5, 0));
  });

  it("keeps the offset when trimming", () => {
    expect(parseTimestamp("2026-10-19T14:05:00.123456+02:00")).toBe(
      Date.UTC(2026, 9, 19, 12, 5, 0, 123)
    );
  });
});

describe("isUnread with microsecond timestamps", () => {
  const lastRead = { "community:c1": SEEN };

  it("is unread when a newer message from someone else arrives", () => {
    const latest = { created_at: "2026-10-19T12:06:30.987654+00:00", sender_id: "2" };
    expect(isUnread(lastRead, "community:c1", latest, "7")).toBe(true);
  });

  it("is read when the newest message is the one already seen", () => {
    const latest = { created_at: SEEN, sender_id: "2" };
    expect(isUnread(lastRead, "community:c1", latest, "7")).toBe(false);
  });

  it("is read when the newest message is my own", () => {
    const latest = { created_at: "2026-10-19T12:06:30.987654+00:00", sender_id: "7" };
    expect(isUnread(lastRead, "community:c1", latest, "7")).toBe(false);
  });

  it("is unread when nothing has been seen in that chat", () => {
    const latest = { created_at: SEEN, sender_id: "2" };
    expect(isUnread({}, "dm:2", latest, "7")).toBe(true);
  });
});
