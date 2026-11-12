import { useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  getImageUrl,
  type ImageBucket,
} from "../services/supabase_api";

type SignedUrlState = { key: string; url: string | null; expiresAt: number };

export function useSignedUrl(
  bucket: ImageBucket,
  path: string | null,
  expiresIn = 3600,
) {
  const [resolved, setResolved] = useState<SignedUrlState | null>(null);

  useEffect(() => {
    if (!path || /^https?:\/\//i.test(path)) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const key = `${bucket}:${path}`;
    const refreshIn = Math.max(expiresIn - 60, 1) * 1000;

    const scheduleRefresh = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), refreshIn);
    };

    const refresh = async () => {
      try {
        const { signedUrl, error } = await getImageUrl(bucket, path, expiresIn);
        if (!active) return;
        setResolved({
          key,
          url: error ? null : signedUrl,
          expiresAt: Date.now() + refreshIn,
        });
      } catch {
        if (!active) return;
        setResolved({ key, url: null, expiresAt: Date.now() + refreshIn });
      }
      scheduleRefresh();
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    void refresh();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      subscription.remove();
    };
  }, [bucket, path, expiresIn]);

  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  return resolved?.key === `${bucket}:${path}` && resolved.expiresAt > Date.now()
    ? resolved.url
    : null;
}