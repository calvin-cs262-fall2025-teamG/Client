import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type BookmarkItem = {
  id: string;
  title: string;
  image?: any;
  count?: number;
  status?: "none" | "borrowed";
  category?: string;
};

type BookmarkContextValue = {
  ids: Set<string>;
  byId: Record<string, BookmarkItem>;
  isSaved: (id: string) => boolean;
  toggle: (item: BookmarkItem) => void;
  remove: (id: string) => void;
  ready: boolean;
};

const STORAGE_KEY = "heyneighbor:bookmarks:v1";

const BookmarksCtx = createContext<BookmarkContextValue | null>(null);

export const BookmarksProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [byId, setById] = useState<Record<string, BookmarkItem>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            ids: string[];
            byId: Record<string, BookmarkItem>;
          };
          setIds(new Set(parsed.ids));
          setById(parsed.byId || {});
        }
      } finally {
        setReady(true);
      }
    };
    load();
  }, []);

  const persist = useCallback(
    async (nextIds: Set<string>, nextById: Record<string, BookmarkItem>) => {
      const idsArray = Array.from(nextIds);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ids: idsArray, byId: nextById })
      );
    },
    []
  );

  const isSaved = useCallback(
    (id: string) => ids.has(id),
    [ids]
  );

  const toggle = useCallback(
    (item: BookmarkItem) => {
      setIds((prevIds) => {
        const nextIds = new Set(prevIds);
        const removing = nextIds.has(item.id);
        const nextById = { ...byId };

        if (removing) {
          nextIds.delete(item.id);
          delete nextById[item.id];
        } else {
          nextIds.add(item.id);
          nextById[item.id] = item;
        }

        setById(nextById);
        persist(nextIds, nextById);
        return nextIds;
      });
    },
    [byId, persist]
  );

  const remove = useCallback(
    (id: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        if (next.delete(id)) {
          const copy = { ...byId };
          delete copy[id];
          setById(copy);
          persist(next, copy);
        }
        return next;
      });
    },
    [byId, persist]
  );

  const value = useMemo(
    () => ({ ids, byId, isSaved, toggle, remove, ready }),
    [ids, byId, isSaved, toggle, remove, ready]
  );

  return (
    <BookmarksCtx.Provider value={value}>{children}</BookmarksCtx.Provider>
  );
};

export const useBookmarks = () => {
  const ctx = useContext(BookmarksCtx);
  if (!ctx) {
    throw new Error("useBookmarks must be used inside BookmarksProvider");
  }
  return ctx;
};

export const useBookmarksUnsafe = () => useContext(BookmarksCtx);
