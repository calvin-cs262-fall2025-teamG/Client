import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageSourcePropType } from "react-native";

const STORAGE_KEY = "bookmarks_byId_v2";

/**
 * Map local filenames (from API like "campingtent.jpg") to require() images.
 * Add any images you use in the app here.
 */
const imageMap: Record<string, any> = {
  "bike.jpg": require("../assets/images/bike.jpg"),
  "campingtent.jpg": require("../assets/images/campingtent.jpg"),
  "chair.jpg": require("../assets/images/chair.jpg"),
  "charger.jpg": require("../assets/images/charger.jpg"),
  "cookbook.jpg": require("../assets/images/cookbook.jpg"),
  "cookset.jpg": require("../assets/images/cookset.jpg"),
  "corebook.jpg": require("../assets/images/corebook.jpg"),
  "desklamp.jpeg": require("../assets/images/desklamp.jpeg"),
  "drill.jpg": require("../assets/images/drill.jpg"),
  "electrickettle.jpg": require("../assets/images/electrickettle.jpg"),
  "hose.jpg": require("../assets/images/hose.jpg"),
  "keurig.png": require("../assets/images/keurig.png"),
  "laptopstand.jpg": require("../assets/images/laptopstand.jpg"),
  "pressurewasher.jpg": require("../assets/images/pressurewasher.jpg"),
  "smartwatch.jpg": require("../assets/images/smartwatch.jpg"),
  "speaker.jpg": require("../assets/images/speaker.jpg"),
  "standingdesk.jpg": require("../assets/images/standingdesk.jpg"),
  "tools.jpg": require("../assets/images/tools.jpg"),
  "tractor.jpg": require("../assets/images/tractor.jpg"),
  "vacuum.jpg": require("../assets/images/vacuum.jpg"),
  "vacuum2.jpg": require("../assets/images/vacuum2.jpg"),
  "vacuum3.jpg": require("../assets/images/vacuum3.jpg"),
  "vacuum4.jpg": require("../assets/images/vacuum4.jpg"),
  "vacuum5.jpg": require("../assets/images/vacuum5.jpg"),
  "vacuum6.jpg": require("../assets/images/vacuum6.jpg"),
  "wirelessbuds.jpg": require("../assets/images/wirelessbuds.jpg"),
  "yogamat.jpg": require("../assets/images/yogamat.jpg"),
};

export type BookmarkItem = {
  id: number;
  title: string;
  status?: string; // "borrowed" | "available" | "none" etc
  count?: number;
  category?: string;

  /** Always a valid RN image source (or undefined). */
  image?: ImageSourcePropType;

  /**
   * Optional key we persist instead of trying to persist the require() number.
   * - if it's a local filename, store that filename
   * - if it's a remote url, store the url
   */
  imageKey?: string | null;
};

type BookmarksContextValue = {
  byId: Record<number, BookmarkItem>;
  isSaved: (id: number) => boolean;
  toggle: (item: any) => void;
  remove: (id: number) => void;
  clear: () => void;
};

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

function normalizeId(raw: any): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : NaN;
}

function normalizeImage(rawImage: any): { image?: ImageSourcePropType; imageKey?: string | null } {
  // Case 1: local require(...) already (RN packs it as a number)
  if (typeof rawImage === "number") {
    return { image: rawImage, imageKey: null };
  }

  // Case 2: string (could be URL or local filename)
  if (typeof rawImage === "string") {
    const trimmed = rawImage.trim();
    if (!trimmed) return { image: undefined, imageKey: null };

    // remote URL
    if (/^https?:\/\//i.test(trimmed)) {
      return { image: { uri: trimmed }, imageKey: trimmed };
    }

    // local filename
    const key = trimmed.toLowerCase();
    const local = imageMap[key];
    return { image: local ?? undefined, imageKey: key };
  }

  // Case 3: already { uri: ... }
  if (rawImage && typeof rawImage === "object" && typeof rawImage.uri === "string") {
    const u = rawImage.uri.trim();
    return u ? { image: { uri: u }, imageKey: u } : { image: undefined, imageKey: null };
  }

  return { image: undefined, imageKey: null };
}

function normalizeBookmarkItem(raw: any): BookmarkItem | null {
  const id = normalizeId(raw?.id ?? raw?.item_id);
  if (!Number.isFinite(id)) return null;

  const title = String(raw?.title ?? raw?.name ?? "").trim();
  if (!title) return null;

  const status = raw?.status ?? raw?.request_status ?? "none";
  const count = typeof raw?.count === "number" ? raw.count : 0;
  const category = raw?.category ? String(raw.category) : undefined;

  // prefer explicit image_url if provided, otherwise image
  const rawImage = raw?.image_url ?? raw?.image;
  const { image, imageKey } = normalizeImage(rawImage);

  return {
    id,
    title,
    status,
    count,
    category,
    image,
    imageKey,
  };
}

type PersistedBookmarkItem = Omit<BookmarkItem, "image">;

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [byId, setById] = useState<Record<number, BookmarkItem>>({});

    // persist on change
  useEffect(() => {
    (async () => {
      try {
        const toPersist: Record<number, PersistedBookmarkItem> = {};

        for (const [idStr, item] of Object.entries(byId)) {
          const id = Number(idStr);

          toPersist[id] = {
            id,
            title: item.title,
            status: item.status,
            count: item.count,
            category: item.category,
            imageKey: item.imageKey ?? null,
          };
        }

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
      } catch (e) {
        console.error("Failed to save bookmarks:", e);
      }
    })();
  }, [byId]);

// persist on change
useEffect(() => {
  (async () => {
    try {
      const toPersist: Record<number, PersistedBookmarkItem> = {};

      for (const [idStr, item] of Object.entries(byId)) {
        const id = Number(idStr);

        toPersist[id] = {
          id,
          title: item.title,
          status: item.status,
          count: item.count,
          category: item.category,
          imageKey: item.imageKey ?? null,
        };
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
      console.error("Failed to save bookmarks:", e);
    }
  })();
}, [byId]);

  const value = useMemo<BookmarksContextValue>(() => {
    return {
      byId,

      isSaved: (id: number) => !!byId[id],

      toggle: (raw: any) => {
        const normalized = normalizeBookmarkItem(raw);
        if (!normalized) return;

        setById((prev) => {
          if (prev[normalized.id]) {
            const copy = { ...prev };
            delete copy[normalized.id];
            return copy;
          }
          return { ...prev, [normalized.id]: normalized };
        });
      },

      remove: (id: number) => {
        const n = Number(id);
        if (!Number.isFinite(n)) return;
        setById((prev) => {
          if (!prev[n]) return prev;
          const copy = { ...prev };
          delete copy[n];
          return copy;
        });
      },

      clear: () => setById({}),
    };
  }, [byId]);

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error("useBookmarks must be used within BookmarksProvider");
  return ctx;
}
