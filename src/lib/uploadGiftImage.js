import { supabase } from "./supabaseClient";

export async function uploadGiftImage(file) {
  if (!file) return { publicUrl: null };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `images/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("gifts")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("gifts").getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}
