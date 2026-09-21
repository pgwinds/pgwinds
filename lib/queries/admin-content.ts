import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Concert, Gallery } from "@/types/content";

export type AdminConcert = Concert & { position: number };
export type AdminGallery = Gallery & { position: number };

export async function getAdminConcerts(): Promise<AdminConcert[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("concerts").select("id,slug,title,description,venue,display_date,starts_at,status,published_at,cta_label,cta_url,position").order("position").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, slug: item.slug as string, title: item.title as string, description: item.description as string, venue: item.venue as string, displayDate: item.display_date as string, startsAt: item.starts_at as string | null, status: item.status as Concert["status"], publishedAt: item.published_at as string | null, ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null, position: item.position as number }));
}

export async function getAdminConcert(id: string): Promise<AdminConcert | null> {
  return (await getAdminConcerts()).find((concert) => concert.id === id) ?? null;
}

export async function getAdminGalleries(): Promise<AdminGallery[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("galleries").select("id,slug,title,description,status,published_at,position").order("position").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, slug: item.slug as string, title: item.title as string, description: item.description as string | null, status: item.status as Gallery["status"], publishedAt: item.published_at as string | null, position: item.position as number }));
}

export async function getAdminGallery(id: string): Promise<AdminGallery | null> {
  return (await getAdminGalleries()).find((gallery) => gallery.id === id) ?? null;
}

export type AdminMediaAsset = { id: string; objectPath: string; altText: string; caption: string; mimeType: string; sizeBytes: number; focalX: number; focalY: number; publicUrl: string; createdAt: string };
export type AdminGalleryImage = AdminMediaAsset & { galleryItemId: string; position: number };
export type AdminMediaAlbum = { id: string; name: string; description: string };
export type AdminMediaTag = { id: string; name: string };
export type OrganizedMediaAsset = AdminMediaAsset & { albums: AdminMediaAlbum[]; tags: AdminMediaTag[]; usages: string[] };
export type AdminMediaLibrary = { assets: OrganizedMediaAsset[]; albums: AdminMediaAlbum[]; tags: AdminMediaTag[]; organizationAvailable: boolean };

export async function getAdminMediaAssets(): Promise<AdminMediaAsset[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("media_assets").select("id,bucket_id,object_path,alt_text,caption,mime_type,size_bytes,focal_x,focal_y,created_at").order("created_at", { ascending: false });
  return (data ?? []).map((item) => ({ id: item.id as string, objectPath: item.object_path as string, altText: item.alt_text as string, caption: (item.caption as string) ?? "", mimeType: item.mime_type as string, sizeBytes: item.size_bytes as number, focalX: (item.focal_x as number | null) ?? 50, focalY: (item.focal_y as number | null) ?? 50, publicUrl: supabase.storage.from(item.bucket_id as string).getPublicUrl(item.object_path as string).data.publicUrl, createdAt: item.created_at as string }));
}

type MediaOrganization = Pick<AdminMediaLibrary, "albums" | "tags" | "organizationAvailable"> & {
  albumsByAsset: Map<string, AdminMediaAlbum[]>;
  tagsByAsset: Map<string, AdminMediaTag[]>;
};

async function getMediaOrganization(supabase: Awaited<ReturnType<typeof createClient>>): Promise<MediaOrganization> {
  const [albumsResult, tagsResult, albumItemsResult, tagItemsResult] = await Promise.all([
    supabase.from("media_albums").select("id,name,description").order("name"),
    supabase.from("media_tags").select("id,name").order("name"),
    supabase.from("media_album_items").select("album_id,media_asset_id"),
    supabase.from("media_asset_tags").select("media_asset_id,tag_id"),
  ]);
  const organizationAvailable = !albumsResult.error && !tagsResult.error && !albumItemsResult.error && !tagItemsResult.error;
  const albums = organizationAvailable ? (albumsResult.data ?? []).map((item) => ({ id: item.id as string, name: item.name as string, description: (item.description as string | null) ?? "" })) : [];
  const tags = organizationAvailable ? (tagsResult.data ?? []).map((item) => ({ id: item.id as string, name: item.name as string })) : [];
  const albumsById = new Map(albums.map((album) => [album.id, album]));
  const tagsById = new Map(tags.map((tag) => [tag.id, tag]));
  const albumsByAsset = new Map<string, AdminMediaAlbum[]>();
  const tagsByAsset = new Map<string, AdminMediaTag[]>();
  for (const item of organizationAvailable ? albumItemsResult.data ?? [] : []) {
    const album = albumsById.get(item.album_id as string);
    if (album) albumsByAsset.set(item.media_asset_id as string, [...(albumsByAsset.get(item.media_asset_id as string) ?? []), album]);
  }
  for (const item of organizationAvailable ? tagItemsResult.data ?? [] : []) {
    const tag = tagsById.get(item.tag_id as string);
    if (tag) tagsByAsset.set(item.media_asset_id as string, [...(tagsByAsset.get(item.media_asset_id as string) ?? []), tag]);
  }
  return { albums, tags, organizationAvailable, albumsByAsset, tagsByAsset };
}

function withMediaOrganization(assets: AdminMediaAsset[], organization: MediaOrganization, usagesByAsset = new Map<string, string[]>()) {
  return assets.map((asset) => ({ ...asset, albums: organization.albumsByAsset.get(asset.id) ?? [], tags: organization.tagsByAsset.get(asset.id) ?? [], usages: usagesByAsset.get(asset.id) ?? [] }));
}

export async function getAdminMediaPickerLibrary(): Promise<Pick<AdminMediaLibrary, "assets" | "albums" | "tags" | "organizationAvailable">> {
  const assets = await getAdminMediaAssets();
  if (!isSupabaseConfigured) return { assets: [], albums: [], tags: [], organizationAvailable: false };
  const organization = await getMediaOrganization(await createClient());
  return { assets: withMediaOrganization(assets, organization), albums: organization.albums, tags: organization.tags, organizationAvailable: organization.organizationAvailable };
}

export async function getAdminMediaLibrary(): Promise<AdminMediaLibrary> {
  const assets = await getAdminMediaAssets();
  if (!isSupabaseConfigured) return { assets: [], albums: [], tags: [], organizationAvailable: false };
  const supabase = await createClient();
  const [organization, [galleryItemsResult, concertUsageResult, repertoireUsageResult, pageContentResult, pageContentDraftsResult, localizedContentResult, localizedContentDraftsResult]] = await Promise.all([
    getMediaOrganization(supabase),
    Promise.all([
    supabase.from("gallery_items").select("media_asset_id,gallery:galleries(title)"),
    supabase.from("concerts").select("cover_media_id,title").not("cover_media_id", "is", null),
    supabase.from("repertoire").select("cover_media_id,title").not("cover_media_id", "is", null),
    supabase.from("page_content").select("page_key,content"),
    supabase.from("page_content_drafts").select("page_key,content"),
    supabase.from("page_content_localizations").select("page_key,locale,content"),
    supabase.from("page_content_localization_drafts").select("page_key,locale,content"),
    ]),
  ]);
  const usagesByAsset = new Map<string, string[]>();
  const noteUsage = (mediaId: string | null, label: string) => {
    if (mediaId) usagesByAsset.set(mediaId, [...(usagesByAsset.get(mediaId) ?? []), label]);
  };
  for (const item of galleryItemsResult.data ?? []) noteUsage(item.media_asset_id as string, `Gallery: ${((item.gallery as { title?: string } | null)?.title) ?? "collection"}`);
  for (const item of concertUsageResult.data ?? []) noteUsage(item.cover_media_id as string, `Concert cover: ${item.title as string}`);
  for (const item of repertoireUsageResult.data ?? []) noteUsage(item.cover_media_id as string, `Repertoire cover: ${item.title as string}`);
  for (const record of [...(pageContentResult.data ?? []), ...(pageContentDraftsResult.data ?? []), ...(localizedContentResult.data ?? []), ...(localizedContentDraftsResult.data ?? [])]) {
    const serialized = JSON.stringify(record.content);
    for (const asset of assets) if (serialized.includes(`\"${asset.id}\"`)) noteUsage(asset.id, `Website: ${record.page_key as string}`);
  }
  return { assets: withMediaOrganization(assets, organization, usagesByAsset), albums: organization.albums, tags: organization.tags, organizationAvailable: organization.organizationAvailable };
}

export async function getAdminMediaPickerAssets() {
  return (await getAdminMediaPickerLibrary()).assets;
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
  const { data: assets } = await supabase.from("media_assets").select("id,bucket_id,object_path,alt_text,caption,mime_type,size_bytes,focal_x,focal_y,created_at").in("id", mediaIds);
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
      focalX: (asset.focal_x as number | null) ?? 50,
      focalY: (asset.focal_y as number | null) ?? 50,
      publicUrl: supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl,
      createdAt: asset.created_at as string,
    }];
  });
}
