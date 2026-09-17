import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Repertoire } from "@/types/content";

function toRepertoire(item: Record<string, unknown>): Repertoire {
  return { id: item.id as string, slug: item.slug as string, title: item.title as string, composer: item.composer as string | null, arranger: item.arranger as string | null, instrumentation: item.instrumentation as string | null, notes: item.notes as string | null, coverMediaId: item.cover_media_id as string | null, youtubeUrl: item.youtube_url as string | null, status: item.status as Repertoire["status"], publishedAt: item.published_at as string | null };
}

export async function getPublicRepertoire(): Promise<Repertoire[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("repertoire").select("id,slug,title,composer,arranger,instrumentation,notes,cover_media_id,youtube_url,status,published_at").eq("status", "published").order("published_at", { ascending: false });
    return (data ?? []).filter((item) => item.slug).map((item) => toRepertoire(item as Record<string, unknown>));
  } catch { return []; }
}

export async function getAdminRepertoire(): Promise<Repertoire[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("repertoire").select("id,slug,title,composer,arranger,instrumentation,notes,cover_media_id,youtube_url,status,published_at").order("created_at", { ascending: false });
  return (data ?? []).map((item) => toRepertoire(item as Record<string, unknown>));
}

export async function getAdminRepertoireItem(id: string): Promise<Repertoire | null> {
  return (await getAdminRepertoire()).find((item) => item.id === id) ?? null;
}

export async function getPublicRepertoireItem(slug: string): Promise<Repertoire | null> {
  return (await getPublicRepertoire()).find((item) => item.slug === slug) ?? null;
}

export async function getPublicRepertoireCoverUrl(mediaId: string | null): Promise<string | null> {
  if (!mediaId || !isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("media_assets").select("bucket_id,object_path").eq("id", mediaId).maybeSingle();
    return data ? supabase.storage.from(data.bucket_id as string).getPublicUrl(data.object_path as string).data.publicUrl : null;
  } catch { return null; }
}

export async function getPublicRepertoireCoverUrls(mediaIds: Array<string | null>): Promise<Record<string, string>> {
  const ids = [...new Set(mediaIds.filter((id): id is string => Boolean(id)))];
  if (!isSupabaseConfigured || ids.length === 0) return {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("media_assets").select("id,bucket_id,object_path").in("id", ids);
    return Object.fromEntries((data ?? []).map((asset) => [asset.id as string, supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl]));
  } catch { return {}; }
}
