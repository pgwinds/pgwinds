import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const programmeSections = ["news", "events", "artists", "repertoire", "members", "alumni"] as const;
export type ProgrammeSection = (typeof programmeSections)[number];

export type ListingItem = { id: string; title: string; summary: string; meta: string; ctaLabel?: string | null; ctaUrl?: string | null };
export type AdminProgrammeItem = ListingItem & { status: string; slug: string; dateTime: string };

export async function getPublishedListings(table: ProgrammeSection): Promise<ListingItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    if (table === "news") { const { data } = await supabase.from("news").select("id,title,excerpt,published_at,cta_label,cta_url").eq("status", "published").order("published_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.excerpt as string, meta: item.published_at ? new Date(item.published_at as string).toLocaleDateString("en-GB") : "", ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "events") { const { data } = await supabase.from("events").select("id,title,description,venue,starts_at,cta_label,cta_url").eq("status", "published").order("starts_at", { ascending: true }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.description as string, meta: [item.starts_at ? new Date(item.starts_at as string).toLocaleDateString("en-GB") : "", item.venue as string].filter(Boolean).join(" · "), ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "artists") { const { data } = await supabase.from("artists").select("id,name,biography,cta_label,cta_url").eq("status", "published"); return (data ?? []).map((item) => ({ id: item.id as string, title: item.name as string, summary: item.biography as string, meta: "", ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "members" || table === "alumni") { const { data } = await supabase.from(table).select("id,full_name,instrument,biography").eq("status", "published"); return (data ?? []).map((item) => ({ id: item.id as string, title: item.full_name as string, summary: item.biography as string, meta: item.instrument as string })); }
    const { data } = await supabase.from("repertoire").select("id,title,composer,notes").eq("status", "published");
    return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, summary: item.notes as string, meta: item.composer as string }));
  } catch { return []; }
}

export async function getAdminProgrammeListings(table: ProgrammeSection): Promise<AdminProgrammeItem[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    if (table === "news") { const { data } = await supabase.from("news").select("id,title,slug,excerpt,status,published_at,cta_label,cta_url").order("created_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, slug: item.slug as string, summary: item.excerpt as string, meta: item.published_at ? new Date(item.published_at as string).toLocaleDateString("en-GB") : "", dateTime: "", status: item.status as string, ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "events") { const { data } = await supabase.from("events").select("id,title,slug,description,venue,starts_at,status,cta_label,cta_url").order("created_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, slug: item.slug as string, summary: item.description as string, meta: (item.venue as string) ?? "", dateTime: item.starts_at ? new Date(item.starts_at as string).toISOString().slice(0, 16) : "", status: item.status as string, ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "artists") { const { data } = await supabase.from("artists").select("id,name,slug,biography,status,cta_label,cta_url").order("created_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.name as string, slug: item.slug as string, summary: item.biography as string, meta: "", dateTime: "", status: item.status as string, ctaLabel: item.cta_label as string | null, ctaUrl: item.cta_url as string | null })); }
    if (table === "members" || table === "alumni") { const { data } = await supabase.from(table).select("id,full_name,instrument,biography,status").order("created_at", { ascending: false }); return (data ?? []).map((item) => ({ id: item.id as string, title: item.full_name as string, slug: "", summary: (item.biography as string) ?? "", meta: (item.instrument as string) ?? "", dateTime: "", status: item.status as string })); }
    const { data } = await supabase.from("repertoire").select("id,title,composer,notes,status").order("created_at", { ascending: false });
    return (data ?? []).map((item) => ({ id: item.id as string, title: item.title as string, slug: "", summary: (item.notes as string) ?? "", meta: (item.composer as string) ?? "", dateTime: "", status: item.status as string }));
  } catch { return []; }
}

export async function getAdminProgrammeItem(table: ProgrammeSection, id: string): Promise<AdminProgrammeItem | null> {
  const items = await getAdminProgrammeListings(table);
  return items.find((item) => item.id === id) ?? null;
}
