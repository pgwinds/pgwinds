import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Gallery } from "@/types/content";

export async function getPublicGalleries(): Promise<Gallery[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("galleries")
      .select("id, slug, title, description, status, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error || !data) return [];

    return data.map((gallery) => ({
      id: gallery.id as string,
      slug: gallery.slug as string,
      title: gallery.title as string,
      description: gallery.description as string | null,
      status: gallery.status as Gallery["status"],
      publishedAt: gallery.published_at as string | null,
    }));
  } catch {
    return [];
  }
}
