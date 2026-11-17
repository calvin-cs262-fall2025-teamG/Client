import { Image, type ImageProps } from "expo-image";
import { useSignedUrl } from "../../hooks/useSignedUrl";
import type { ImageBucket } from "../../services/supabase_api";

type StorageImageProps = Omit<ImageProps, "source"> & {
  bucket: ImageBucket;
  path: string | null;
  localSource?: ImageProps["source"];
};

export default function StorageImage({
  bucket,
  path,
  localSource,
  ...props
}: StorageImageProps) {
  const signedUrl = useSignedUrl(
    bucket,
    localSource == null ? path : null,
  );
  const source =
    localSource ??
    (signedUrl && path
      ? { uri: signedUrl, cacheKey: `${bucket}:${path}` }
      : null);

  return <Image {...props} source={source} />;
}