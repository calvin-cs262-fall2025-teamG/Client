import type { ImagePickerAsset } from "expo-image-picker";
import type { ImageInput } from "../services/supabase_api";

// Reads a picked photo into the shape the items API uploads. The extension
// comes from the mime type, falling back to the file name.
export async function toImageInput(asset: ImagePickerAsset): Promise<ImageInput> {
  const data = await (await fetch(asset.uri)).arrayBuffer();
  const fromMime = asset.mimeType?.split("/")[1];
  const fromName = (asset.fileName ?? asset.uri).split(/[?#]/)[0].split(".").pop();
  const ext = (fromMime ?? fromName)?.toLowerCase();
  return ext ? { data, ext } : { data };
}
