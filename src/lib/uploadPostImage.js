import { supabase } from "./supabaseClient";

export async function uploadPostImage(file) {
  if (!file) return { publicUrl: null };

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const path = `covers/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("posts")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("posts").getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}