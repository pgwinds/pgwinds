import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Concert, Gallery } from "@/types/content";

export async function getAdminConcerts(): Promise<Concert[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("concerts").select("id,slug,title,description,venue,display_date,starts_at,status,published_at,cta_label,cta_url").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, slug: item.slug as string, title: item.title as string, description: item.description as string, venue: item.venue as string, displayDate: item.display_date as string, startsAt: item.starts_at as string | null, status: item.status as Concert["status"], publishedAt: item.published_at as string | null, ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null }));
}

export async function getAdminConcert(id: string): Promise<Concert | null> {
  return (await getAdminConcerts()).find((concert) => concert.id === id) ?? null;
}

export async function getAdminGalleries(): Promise<Gallery[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("galleries").select("id,slug,title,description,status,published_at").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, slug: item.slug as string, title: item.title as string, description: item.description as string | null, status: item.status as Gallery["status"], publishedAt: item.published_at as string | null }));
}

export async function getAdminGallery(id: string): Promise<Gallery | null> {
  return (await getAdminGalleries()).find((gallery) => gallery.id === id) ?? null;
}

export type AdminMediaAsset = { id: string; objectPath: string; altText: string; caption: string; mimeType: string; sizeBytes: number; publicUrl: string };
export type AdminGalleryImage = AdminMediaAsset & { galleryItemId: string; position: number };

export async function getAdminMediaAssets(): Promise<AdminMediaAsset[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("media_assets").select("id,bucket_id,object_path,alt_text,caption,mime_type,size_bytes").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, objectPath: item.object_path as string, altText: item.alt_text as string, caption: (item.caption as string) ?? "", mimeType: item.mime_type as string, sizeBytes: item.size_bytes as number, publicUrl: supabase.storage.from(item.bucket_id as string).getPublicUrl(item.object_path as string).data.publicUrl }));
}

export async function getAdminMediaAsset(id: string): Promise<AdminMediaAsset | null> {
  return (await getAdminMediaAssets()).find((asset) => asset.id === id) ?? null;
}

export async function getAdminGalleryImages(galleryId: string): Promise<AdminGalleryImage[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data: items } = await supabase.from("gallery_items").select("id,media_asset_id,position").eq("gallery_id", galleryId).order("position");
  const mediaIds = (items ?? []).map((item) => item.media_asset_id as string);
  if (mediaIds.length === 0) return [];
  const { data: assets } = await supabase.from("media_assets").select("id,bucket_id,object_path,alt_text,caption,mime_type,size_bytes").in("id", mediaIds);
  const assetsById = new Map((assets ?? []).map((asset) => [asset.id as string, asset]));
  return (items ?? []).flatMap((item) => {
    const asset = assetsById.get(item.media_asset_id as string);
    if (!asset) return [];
    return [{
      galleryItemId: item.id as string,
      position: item.position as number,
      id: asset.id as string,
      objectPath: asset.object_path as string,
      altText: asset.alt_text as string,
      caption: (asset.caption as string) ?? "",
      mimeType: asset.mime_type as string,
      sizeBytes: asset.size_bytes as number,
      publicUrl: supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl,
    }];
  });
}
