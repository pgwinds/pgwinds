import { concerts as fallbackConcerts } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Concert } from "@/types/content";

export async function getPublicConcerts(): Promise<Concert[]> {
  if (!isSupabaseConfigured) return fallbackConcerts;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("concerts")
      .select("id, slug, title, description, venue, display_date, starts_at, status, published_at, cta_label, cta_url")
      .eq("status", "published")
      .order("starts_at", { ascending: true, nullsFirst: false });

    if (error || !data || data.length === 0) return fallbackConcerts;

    return data.map((concert) => ({
      id: concert.id as string,
      slug: concert.slug as string,
      title: concert.title as string,
      description: concert.description as string,
      venue: concert.venue as string,
      displayDate: concert.display_date as string,
      startsAt: concert.starts_at as string | null,
      status: concert.status as Concert["status"],
      publishedAt: concert.published_at as string | null,
      ctaLabel: concert.cta_label as string | null,
      ctaUrl: concert.cta_url as string | null,
    }));
  } catch {
    return fallbackConcerts;
  }
}

export async function getFeaturedConcert(): Promise<Concert> {
  const [concert] = await getPublicConcerts();
  return concert;
}
