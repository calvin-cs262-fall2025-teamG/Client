import { useCallback, useEffect, useRef, useState } from "react";

export type RpcResult<T> = { data: T | null; error: { message: string } | null };

export function unwrap<T>(result: RpcResult<T>): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export function replaceById<T extends { id: string }>(list: T[], row: T): T[] {
  return list.map((r) => (r.id === row.id ? row : r));
}

export type Take = <T>(result: RpcResult<T>, set: (value: T | null) => void) => void;

// Apply each result on its own, so one failed call doesn't skip the rest.
// A value whose call failed keeps its previous value. Returns the error messages.
export function collectResults(apply: (take: Take) => void): string[] {
  const failures: string[] = [];
  apply((result, set) => {
    if (result.error) failures.push(result.error.message);
    else set(result.data);
  });
  return failures;
}

export type LoadState = {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Loads data for the signed-in user and clears it on sign-out.
 *
 * `fetchAll` makes the requests and returns a function that applies the results.
 * It only runs if no newer load (or sign-out) has started since.
 * `fetchAll` and `reset` must be stable (wrap them in useCallback).
 */
export function useUserScopedLoad(
  userId: string | undefined,
  fetchAll: () => Promise<(take: Take) => void>,
  reset: () => void,
  fallbackError = "Could not load your data"
): LoadState {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const apply = await fetchAll();
      if (id !== requestId.current) return;
      const failures = collectResults(apply);
      if (failures.length > 0) setError(failures[0]);
    } catch (e) {
      // Only reached if a call itself throws (for example, no network).
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : fallbackError);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [fetchAll, fallbackError]);

  useEffect(() => {
    if (!userId) {
      // Signed out: ignore any load still in flight and drop the old user's data.
      requestId.current++;
      reset();
      /* eslint-disable react-hooks/set-state-in-effect */
      setLoading(false);
      setError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    void refresh();
  }, [userId, refresh, reset]);

  return { loading, error, refresh };
}
