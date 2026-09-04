import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Gallery } from "@/types/content";

export type GalleryImage = {
  id: string;
  mediaAssetId: string;
  position: number;
  altText: string;
  caption: string | null;
  publicUrl: string;
};

export type PublicGallery = Gallery & { images: GalleryImage[] };

export async function getPublicGalleries(): Promise<PublicGallery[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data: galleries, error: galleryError } = await supabase
      .from("galleries")
      .select("id,slug,title,description,status,published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (galleryError || !galleries?.length) return [];

    const galleryIds = galleries.map((gallery) => gallery.id as string);
    const { data: galleryItems, error: itemError } = await supabase
      .from("gallery_items")
      .select("id,gallery_id,media_asset_id,position")
      .in("gallery_id", galleryIds)
      .order("position");
    if (itemError) return [];

    const mediaIds = [...new Set((galleryItems ?? []).map((item) => item.media_asset_id as string))];
    const { data: assets, error: assetError } = mediaIds.length
      ? await supabase.from("media_assets").select("id,bucket_id,object_path,alt_text,caption").in("id", mediaIds)
      : { data: [], error: null };
    if (assetError) return [];

    const assetById = new Map((assets ?? []).map((asset) => [asset.id as string, {
      altText: asset.alt_text as string,
      caption: asset.caption as string | null,
      publicUrl: supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl,
    }]));

    return galleries.map((gallery) => ({
      id: gallery.id as string,
      slug: gallery.slug as string,
      title: gallery.title as string,
      description: gallery.description as string | null,
      status: gallery.status as Gallery["status"],
      publishedAt: gallery.published_at as string | null,
      images: (galleryItems ?? [])
        .filter((item) => item.gallery_id === gallery.id && assetById.has(item.media_asset_id as string))
        .map((item) => {
          const asset = assetById.get(item.media_asset_id as string)!;
          return { id: item.id as string, mediaAssetId: item.media_asset_id as string, position: item.position as number, ...asset };
        }),
    }));
  } catch {
    return [];
  }
}
