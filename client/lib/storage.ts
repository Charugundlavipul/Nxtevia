import { supabase } from "./supabase";

export async function uploadPublicFile(bucket: string, file: File, path: string) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

