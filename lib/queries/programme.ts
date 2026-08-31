import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type ListingItem = { id: string; title: string; summary: string; meta: string };

export async function getPublishedListings(table: "news" | "events" | "artists" | "repertoire" | "members" | "alumni"): Promise<ListingItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    if (table === "news") { const { data } = await supabase.from("news").select("id,title,excerpt,published_at").eq("status", "published").order("published_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.excerpt as string, meta: item.published_at ? new Date(item.published_at as string).toLocaleDateString("en-GB") : "" })); }
    if (table === "events") { const { data } = await supabase.from("events").select("id,title,description,venue,starts_at").eq("status", "published").order("starts_at", { ascending: true }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.description as string, meta: [item.starts_at ? new Date(item.starts_at as string).toLocaleDateString("en-GB") : "", item.venue as string].filter(Boolean).join(" · ") })); }
    if (table === "artists") { const { data } = await supabase.from("artists").select("id,name,biography").eq("status", "published"); return (data ?? []).map((item) => ({ id: item.id as string, title: item.name as string, summary: item.biography as string, meta: "" })); }
    if (table === "members" || table === "alumni") { const { data } = await supabase.from(table).select("id,full_name,instrument,biography").eq("status", "published"); return (data ?? []).map((item) => ({ id: item.id as string, title: item.full_name as string, summary: item.biography as string, meta: item.instrument as string })); }
    const { data } = await supabase.from("repertoire").select("id,title,composer,notes").eq("status", "published");
    return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.notes as string, meta: item.composer as string }));
  } catch { return []; }
}
