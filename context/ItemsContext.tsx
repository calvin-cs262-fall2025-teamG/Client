import React, { createContext, useCallback, useContext, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  items,
  type CreateItemRequest,
  type ImageInput,
  type Item,
  type UpdateItemRequest,
} from "../services/supabase_api";
import { replaceById, unwrap, useUserScopedLoad, type LoadState, type Take } from "./contextUtils";

export type ItemsValue = LoadState & {
  myItems: Item[];
  createItem: (data: CreateItemRequest, image?: ImageInput) => Promise<Item>;
  updateItem: (id: string, data: UpdateItemRequest, image?: ImageInput) => Promise<Item>;
  deleteItem: (id: string) => Promise<void>;
};

const ItemsContext = createContext<ItemsValue | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [myItems, setMyItems] = useState<Item[]>([]);

  const fetchAll = useCallback(async () => {
    const i = await items.getMine();
    return (take: Take) => take(i, (v) => setMyItems(v ?? []));
  }, []);

  const reset = useCallback(() => setMyItems([]), []);

  const { loading, error, refresh } = useUserScopedLoad(
    user?.id,
    fetchAll,
    reset,
    "Could not load your items"
  );

  const createItem = useCallback(async (data: CreateItemRequest, image?: ImageInput) => {
    const created = unwrap(await (image ? items.create(data, image) : items.create(data)));
    setMyItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateItem = useCallback(async (id: string, data: UpdateItemRequest, image?: ImageInput) => {
    const updated = unwrap(await (image ? items.update(id, data, image) : items.update(id, data)));
    setMyItems((prev) => replaceById(prev, updated));
    return updated;
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    unwrap(await items.delete(id));
    setMyItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const value: ItemsValue = {
    myItems,
    loading,
    error,
    refresh,
    createItem,
    updateItem,
    deleteItem,
  };

  return <ItemsContext.Provider value={value}>{children}</ItemsContext.Provider>;
}

export function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used inside <ItemsProvider>");
  return ctx;
}
