import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";
import { localizeAboutContent, localizeContactContent, localizeHomeContent } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/shared";
import { aboutContentSchema, collectionAppearanceSchema, contactContentSchema, defaultAboutContent, defaultContactContent, defaultHomeContent, defaultSiteSettings, homeContentSchema, siteSettingsContentSchema, type AboutContent, type CollectionAppearance, type ContactContent, type HomeContent, type SiteSettingsContent } from "@/lib/validations/website";

export type HomeMediaUrls = { desktop: string | null; mobile: string | null; featured: string | null };

function parseHomeContent(value: unknown): HomeContent | null {
  const parsed = homeContentSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

type StoredPageContent = { content: unknown; updated_at?: string | null } | null | undefined;

function selectLatestEditorContent<T>(draftRecord: StoredPageContent, publishedRecord: StoredPageContent, parse: (value: unknown) => T | null, fallback: T) {
  const draft = parse(draftRecord?.content);
  const published = parse(publishedRecord?.content);
  const draftUpdatedAt = draftRecord?.updated_at ? Date.parse(draftRecord.updated_at) : Number.NEGATIVE_INFINITY;
  const publishedUpdatedAt = publishedRecord?.updated_at ? Date.parse(publishedRecord.updated_at) : Number.NEGATIVE_INFINITY;

  // A previously saved English draft must not hide a newer Thai publication.
  // A later draft still wins, so edits remain available on the next visit.
  const editorValue = draft && (!published || draftUpdatedAt > publishedUpdatedAt)
    ? draft
    : published ?? draft ?? fallback;

  return { draft: editorValue, published };
}

export async function getPublishedHomeContent(locale: Locale = "en"): Promise<{ content: HomeContent; media: HomeMediaUrls }> {
  const fallback = localizeHomeContent(defaultHomeContent, locale);
  if (!isSupabaseConfigured) return { content: fallback, media: { desktop: null, mobile: null, featured: null } };
  try {
    const supabase = await createClient();
    const table = locale === "th" ? "page_content_localizations" : "page_content";
    let query = supabase.from(table).select("content").eq("page_key", "home");
    if (locale === "th") query = query.eq("locale", "th");
    const { data } = await query.maybeSingle();
    const content = parseHomeContent(data?.content) ?? fallback;
    const ids = [content.hero.desktopMediaId, content.hero.mobileMediaId, content.featured.backgroundMediaId].filter((id): id is string => Boolean(id));
    if (ids.length === 0) return { content, media: { desktop: null, mobile: null, featured: null } };
    const { data: assets } = await supabase.from("media_assets").select("id,bucket_id,object_path").in("id", ids);
    const urls = new Map((assets ?? []).map((asset) => [asset.id as string, supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl]));
    return { content, media: { desktop: content.hero.desktopMediaId ? urls.get(content.hero.desktopMediaId) ?? null : null, mobile: content.hero.mobileMediaId ? urls.get(content.hero.mobileMediaId) ?? null : null, featured: content.featured.backgroundMediaId ? urls.get(content.featured.backgroundMediaId) ?? null : null } };
  } catch { return { content: fallback, media: { desktop: null, mobile: null, featured: null } }; }
}

export async function getAdminHomeContent(locale: Locale = "en"): Promise<{ draft: HomeContent; published: HomeContent | null }> {
  const fallback = localizeHomeContent(defaultHomeContent, locale);
  if (!isSupabaseConfigured) return { draft: fallback, published: null };
  const supabase = await createClient();
  const draftTable = locale === "th" ? "page_content_localization_drafts" : "page_content_drafts";
  const publishedTable = locale === "th" ? "page_content_localizations" : "page_content";
  let draftQuery = supabase.from(draftTable).select("content,updated_at").eq("page_key", "home");
  let publishedQuery = supabase.from(publishedTable).select("content,updated_at").eq("page_key", "home");
  if (locale === "th") { draftQuery = draftQuery.eq("locale", "th"); publishedQuery = publishedQuery.eq("locale", "th"); }
  const [{ data: draft }, { data: published }] = await Promise.all([
    draftQuery.maybeSingle(), publishedQuery.maybeSingle(),
  ]);
  return selectLatestEditorContent(draft, published, parseHomeContent, fallback);
}

async function getPageVersions(pageKey: string, locale: Locale = "en") {
  const supabase = await createClient();
  const draftTable = locale === "th" ? "page_content_localization_drafts" : "page_content_drafts";
  const publishedTable = locale === "th" ? "page_content_localizations" : "page_content";
  let draftQuery = supabase.from(draftTable).select("content,updated_at").eq("page_key", pageKey);
  let publishedQuery = supabase.from(publishedTable).select("content,updated_at").eq("page_key", pageKey);
  if (locale === "th") { draftQuery = draftQuery.eq("locale", "th"); publishedQuery = publishedQuery.eq("locale", "th"); }
  return Promise.all([
    draftQuery.maybeSingle(), publishedQuery.maybeSingle(),
  ]);
}

async function getPublicMediaUrl(mediaId: string | null) {
  if (!mediaId || !isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("media_assets").select("bucket_id,object_path").eq("id", mediaId).maybeSingle();
  return data ? supabase.storage.from(data.bucket_id as string).getPublicUrl(data.object_path as string).data.publicUrl : null;
}

export const collectionAppearancePages = ["gallery", "artists", "repertoire"] as const;
export type CollectionAppearancePage = (typeof collectionAppearancePages)[number];

function defaultCollectionAppearance(pageKey: CollectionAppearancePage, locale: Locale): CollectionAppearance {
  const copy = locale === "th"
    ? {
        gallery: ["ช่วงเวลาในเสียงดนตรี", "ภาพของผู้คน การซ้อม และการแสดงเบื้องหลัง PGWINDS"],
        artists: ["นักดนตรีที่เรายินดีต้อนรับ", "พบกับศิลปินผู้ร่วมแบ่งปันเวทีกับ PGWINDS"],
        repertoire: ["ดนตรีที่เราเก็บไว้กับตัว", "สำรวจบทเพลงที่หล่อหลอมเสียงของ PGWINDS และย้อนชมการแสดงที่คัดสรร"],
      }
    : {
        gallery: ["Moments in music.", "A glimpse of the people, practice, and performances behind PGWINDS."],
        artists: ["Musicians we welcome.", "Meet the artists who share the stage with PGWINDS."],
        repertoire: ["Music we carry with us.", "Explore the pieces that shape the PGWINDS sound and revisit selected performances."],
      };
  const [title, intro] = copy[pageKey];
  return { hero: { title, intro, mediaId: null, overlay: 40 } };
}

export async function getPublishedCollectionAppearance(pageKey: CollectionAppearancePage, locale: Locale = "en"): Promise<{ content: CollectionAppearance; heroImageUrl: string | null }> {
  const fallback = defaultCollectionAppearance(pageKey, locale);
  if (!isSupabaseConfigured) return { content: fallback, heroImageUrl: null };
  try {
    const supabase = await createClient();
    const table = locale === "th" ? "page_content_localizations" : "page_content";
    let query = supabase.from(table).select("content").eq("page_key", pageKey);
    if (locale === "th") query = query.eq("locale", "th");
    const { data } = await query.maybeSingle();
    const parsed = collectionAppearanceSchema.safeParse(data?.content);
    const content = parsed.success ? parsed.data : fallback;
    return { content, heroImageUrl: await getPublicMediaUrl(content.hero.mediaId) };
  } catch { return { content: fallback, heroImageUrl: null }; }
}

export async function getAdminCollectionAppearance(pageKey: CollectionAppearancePage, locale: Locale = "en"): Promise<{ draft: CollectionAppearance; published: CollectionAppearance | null }> {
  const fallback = defaultCollectionAppearance(pageKey, locale);
  if (!isSupabaseConfigured) return { draft: fallback, published: null };
  const [{ data: draft }, { data: published }] = await getPageVersions(pageKey, locale);
  return selectLatestEditorContent(draft, published, (content) => {
    const result = collectionAppearanceSchema.safeParse(content);
    return result.success ? result.data : null;
  }, fallback);
}

export async function getMediaPublicUrls(mediaIds: string[]): Promise<Record<string, string>> {
  const ids = [...new Set(mediaIds.filter(Boolean))];
  if (!isSupabaseConfigured || ids.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase.from("media_assets").select("id,bucket_id,object_path").in("id", ids);
  return Object.fromEntries((data ?? []).map((asset) => [asset.id as string, supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl]));
}

export async function getPublishedAboutContent(locale: Locale = "en"): Promise<{ content: AboutContent; heroImageUrl: string | null }> {
  const fallback = localizeAboutContent(defaultAboutContent, locale);
  if (!isSupabaseConfigured) return { content: fallback, heroImageUrl: null };
  try {
    const supabase = await createClient();
    const table = locale === "th" ? "page_content_localizations" : "page_content";
    let query = supabase.from(table).select("content").eq("page_key", "about");
    if (locale === "th") query = query.eq("locale", "th");
    const { data } = await query.maybeSingle();
    const parsed = aboutContentSchema.safeParse(data?.content);
    const content = parsed.success ? parsed.data : fallback;
    return { content, heroImageUrl: await getPublicMediaUrl(content.hero.mediaId) };
  } catch { return { content: fallback, heroImageUrl: null }; }
}

export async function getAdminAboutContent(locale: Locale = "en"): Promise<{ draft: AboutContent; published: AboutContent | null }> {
  const fallback = localizeAboutContent(defaultAboutContent, locale);
  if (!isSupabaseConfigured) return { draft: fallback, published: null };
  const [{ data: draft }, { data: published }] = await getPageVersions("about", locale);
  return selectLatestEditorContent(draft, published, (content) => {
    const result = aboutContentSchema.safeParse(content);
    return result.success ? result.data : null;
  }, fallback);
}

export async function getPublishedContactContent(locale: Locale = "en"): Promise<ContactContent> {
  const fallback = localizeContactContent(defaultContactContent, locale);
  if (!isSupabaseConfigured) return fallback;
  try {
    const supabase = await createClient();
    const table = locale === "th" ? "page_content_localizations" : "page_content";
    let query = supabase.from(table).select("content").eq("page_key", "contact");
    if (locale === "th") query = query.eq("locale", "th");
    const { data } = await query.maybeSingle();
    const parsed = contactContentSchema.safeParse(data?.content);
    return parsed.success ? parsed.data : fallback;
  } catch { return fallback; }
}

export async function getAdminContactContent(locale: Locale = "en"): Promise<{ draft: ContactContent; published: ContactContent | null }> {
  const fallback = localizeContactContent(defaultContactContent, locale);
  if (!isSupabaseConfigured) return { draft: fallback, published: null };
  const [{ data: draft }, { data: published }] = await getPageVersions("contact", locale);
  return selectLatestEditorContent(draft, published, (content) => {
    const result = contactContentSchema.safeParse(content);
    return result.success ? result.data : null;
  }, fallback);
}

export type SocialLink = { id: string; platform: string; label: string | null; url: string; visible: boolean; position: number };

function toSocialLink(item: Record<string, unknown>): SocialLink { return { id: item.id as string, platform: item.platform as string, label: item.label as string | null, url: item.url as string, visible: item.visible as boolean, position: item.position as number }; }

export async function getPublicSocialLinks(): Promise<SocialLink[]> {
  if (!isSupabaseConfigured) return [];
  try { const supabase = await createClient(); const { data } = await supabase.from("social_links").select("id,platform,label,url,visible,position").order("position"); return (data ?? []).map((item) => toSocialLink(item as Record<string, unknown>)); } catch { return []; }
}

export async function getAdminSocialLinks(): Promise<SocialLink[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("social_links").select("id,platform,label,url,visible,position").order("position");
  return (data ?? []).map((item) => toSocialLink(item as Record<string, unknown>));
}

export async function getAdminSocialLink(id: string): Promise<SocialLink | null> {
  return (await getAdminSocialLinks()).find((link) => link.id === id) ?? null;
}

export type NavigationItem = { id: string; itemKey: string; label: string; href: string; groupName: "main" | "more"; visible: boolean; position: number };

function toNavigationItem(item: Record<string, unknown>): NavigationItem { return { id: item.id as string, itemKey: item.item_key as string, label: item.label as string, href: item.href as string, groupName: item.group_name as NavigationItem["groupName"], visible: item.visible as boolean, position: item.position as number }; }

const navigationFallback: NavigationItem[] = [
  { id: "about", itemKey: "about", label: "About", href: "/about", groupName: "main", visible: true, position: 10 },
  { id: "concerts", itemKey: "concerts", label: "Concerts", href: "/concerts", groupName: "main", visible: true, position: 20 },
  { id: "contact", itemKey: "contact", label: "Contact", href: "/contact", groupName: "main", visible: true, position: 30 },
  { id: "gallery", itemKey: "gallery", label: "Gallery", href: "/gallery", groupName: "more", visible: true, position: 10 },
  { id: "artists", itemKey: "artists", label: "Artists", href: "/artists", groupName: "more", visible: true, position: 20 },
  { id: "repertoire", itemKey: "repertoire", label: "Repertoire", href: "/repertoire", groupName: "more", visible: true, position: 30 },
];

export async function getPublicNavigation(): Promise<NavigationItem[]> {
  if (!isSupabaseConfigured) return navigationFallback;
  try { const supabase = await createClient(); const { data, error } = await supabase.from("navigation_items").select("id,item_key,label,href,group_name,visible,position").eq("visible", true).order("position"); return !error && data && data.length > 0 ? data.map((item) => toNavigationItem(item as Record<string, unknown>)) : navigationFallback; } catch { return navigationFallback; }
}

export async function getAdminNavigationItems(): Promise<NavigationItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("navigation_items").select("id,item_key,label,href,group_name,visible,position").order("group_name").order("position");
  return (data ?? []).map((item) => toNavigationItem(item as Record<string, unknown>));
}

export async function getAdminNavigationItem(id: string): Promise<NavigationItem | null> {
  return (await getAdminNavigationItems()).find((item) => item.id === id) ?? null;
}

export type SiteSettingsMediaUrls = { logo: string | null; favicon: string | null; ogImage: string | null };

export const getPublishedSiteSettings = cache(async (): Promise<{ content: SiteSettingsContent; media: SiteSettingsMediaUrls }> => {
  if (!isSupabaseConfigured) return { content: defaultSiteSettings, media: { logo: null, favicon: null, ogImage: null } };
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("page_content").select("content").eq("page_key", "site-settings").maybeSingle();
    const parsed = siteSettingsContentSchema.safeParse(data?.content);
    const content = parsed.success ? parsed.data : defaultSiteSettings;
    const ids = [content.general.logoMediaId, content.general.faviconMediaId, content.seo.ogImageMediaId].filter((id): id is string => Boolean(id));
    if (ids.length === 0) return { content, media: { logo: null, favicon: null, ogImage: null } };
    const { data: assets } = await supabase.from("media_assets").select("id,bucket_id,object_path").in("id", ids);
    const urls = new Map((assets ?? []).map((asset) => [asset.id as string, supabase.storage.from(asset.bucket_id as string).getPublicUrl(asset.object_path as string).data.publicUrl]));
    return { content, media: { logo: content.general.logoMediaId ? urls.get(content.general.logoMediaId) ?? null : null, favicon: content.general.faviconMediaId ? urls.get(content.general.faviconMediaId) ?? null : null, ogImage: content.seo.ogImageMediaId ? urls.get(content.seo.ogImageMediaId) ?? null : null } };
  } catch { return { content: defaultSiteSettings, media: { logo: null, favicon: null, ogImage: null } }; }
});

export async function getAdminSiteSettings(): Promise<{ draft: SiteSettingsContent; published: SiteSettingsContent | null }> {
  if (!isSupabaseConfigured) return { draft: defaultSiteSettings, published: null };
  const [{ data: draft }, { data: published }] = await getPageVersions("site-settings");
  return selectLatestEditorContent(draft, published, (content) => {
    const result = siteSettingsContentSchema.safeParse(content);
    return result.success ? result.data : null;
  }, defaultSiteSettings);
}
