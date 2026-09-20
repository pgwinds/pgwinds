"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/shared";
import { aboutEditorSchema, collectionAppearanceEditorSchema, contactEditorSchema, homeEditorSchema, navigationItemSchema, siteSettingsEditorSchema, socialLinkSchema, toAboutContent, toCollectionAppearance, toContactContent, toHomeContent, toSiteSettingsContent } from "@/lib/validations/website";
import { collectionAppearancePages, type CollectionAppearancePage } from "@/lib/queries/website";

async function getAdminClient() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return { user, supabase: await createClient() };
}

function localeFromForm(formData: FormData): Locale { return formData.get("locale") === "th" ? "th" : "en"; }
function pageContentTable(locale: Locale, draft: boolean) { if (locale === "en") return draft ? "page_content_drafts" : "page_content"; return draft ? "page_content_localization_drafts" : "page_content_localizations"; }
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function orderedIdsFromForm(formData: FormData) {
  try {
    const parsed: unknown = JSON.parse(String(formData.get("contentIds") ?? ""));
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((id) => typeof id !== "string" || !uuidPattern.test(id)) || new Set(parsed).size !== parsed.length) return null;
    return parsed;
  } catch { return null; }
}

async function nextWebsitePosition(supabase: Awaited<ReturnType<typeof createClient>>, table: "social_links" | "navigation_items", groupName?: "main" | "more") {
  let query = supabase.from(table).select("position").order("position", { ascending: false }).limit(1);
  if (table === "navigation_items" && groupName) query = query.eq("group_name", groupName);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error("Could not prepare the display position.");
  return ((data?.position as number | undefined) ?? 0) + 10;
}

async function saveHome(formData: FormData, publish: boolean) {
  const locale = localeFromForm(formData);
  const input = homeEditorSchema.parse(Object.fromEntries(formData));
  const content = toHomeContent(input);
  const { user, supabase } = await getAdminClient();
  const localData = locale === "th" ? { page_key: "home", locale, content } : { page_key: "home", content };
  const conflict = locale === "th" ? "page_key,locale" : "page_key";
  const { error: draftError } = await supabase.from(pageContentTable(locale, true)).upsert(localData as never, { onConflict: conflict });
  if (draftError) throw new Error("Could not save the Home draft.");
  if (publish) {
    const publishedData = { ...localData, published_at: new Date().toISOString() };
    const { error: publishError } = await supabase.from(pageContentTable(locale, false)).upsert(publishedData as never, { onConflict: conflict });
    if (publishError) throw new Error("Could not publish Home settings.");
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: publish ? "website.home.published" : "website.home.draft_saved", entity_type: "page_content", entity_id: null, metadata: { page_key: "home", locale } });
  revalidatePath("/");
  revalidatePath("/th");
  revalidatePath("/admin/website/home");
  redirect(`/admin/website/home?locale=${locale}&status=${publish ? "published" : "draft"}`);
}

export async function saveHomeDraft(formData: FormData) {
  await saveHome(formData, false);
}

export async function publishHomeContent(formData: FormData) {
  await saveHome(formData, true);
}

async function savePageContent(pageKey: "about" | "contact", content: unknown, publish: boolean) {
  const locale = (content as { locale?: Locale }).locale ?? "en";
  const storedContent = { ...(content as Record<string, unknown>) };
  delete storedContent.locale;
  const { user, supabase } = await getAdminClient();
  const localData = locale === "th" ? { page_key: pageKey, locale, content: storedContent } : { page_key: pageKey, content: storedContent };
  const conflict = locale === "th" ? "page_key,locale" : "page_key";
  const { error: draftError } = await supabase.from(pageContentTable(locale, true)).upsert(localData as never, { onConflict: conflict });
  if (draftError) throw new Error(`Could not save the ${pageKey} draft.`);
  if (publish) {
    const { error: publishError } = await supabase.from(pageContentTable(locale, false)).upsert({ ...localData, published_at: new Date().toISOString() } as never, { onConflict: conflict });
    if (publishError) throw new Error(`Could not publish ${pageKey} settings.`);
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: publish ? `website.${pageKey}.published` : `website.${pageKey}.draft_saved`, entity_type: "page_content", metadata: { page_key: pageKey, locale } });
  revalidatePath(`/${pageKey}`);
  revalidatePath(`/th/${pageKey}`);
  revalidatePath(`/admin/website/${pageKey}`);
  redirect(`/admin/website/${pageKey}?locale=${locale}&status=${publish ? "published" : "draft"}`);
}

export async function saveAboutDraft(formData: FormData) { const input = aboutEditorSchema.parse(Object.fromEntries(formData)); await savePageContent("about", { ...toAboutContent(input), locale: localeFromForm(formData) }, false); }
export async function publishAboutContent(formData: FormData) { const input = aboutEditorSchema.parse(Object.fromEntries(formData)); await savePageContent("about", { ...toAboutContent(input), locale: localeFromForm(formData) }, true); }
export async function saveContactDraft(formData: FormData) { const input = contactEditorSchema.parse(Object.fromEntries(formData)); await savePageContent("contact", { ...toContactContent(input), locale: localeFromForm(formData) }, false); }
export async function publishContactContent(formData: FormData) { const input = contactEditorSchema.parse(Object.fromEntries(formData)); await savePageContent("contact", { ...toContactContent(input), locale: localeFromForm(formData) }, true); }

function collectionPageKey(formData: FormData): CollectionAppearancePage {
  const pageKey = formData.get("pageKey");
  if (!collectionAppearancePages.includes(pageKey as CollectionAppearancePage)) throw new Error("This page appearance cannot be edited.");
  return pageKey as CollectionAppearancePage;
}

async function saveCollectionAppearance(formData: FormData, publish: boolean) {
  const pageKey = collectionPageKey(formData);
  const input = collectionAppearanceEditorSchema.parse(Object.fromEntries(formData));
  const locale = localeFromForm(formData);
  const content = toCollectionAppearance(input);
  const { user, supabase } = await getAdminClient();
  const localData = locale === "th" ? { page_key: pageKey, locale, content } : { page_key: pageKey, content };
  const conflict = locale === "th" ? "page_key,locale" : "page_key";
  const { error: draftError } = await supabase.from(pageContentTable(locale, true)).upsert(localData as never, { onConflict: conflict });
  if (draftError) throw new Error(`Could not save the ${pageKey} appearance draft.`);
  if (publish) {
    const { error: publishError } = await supabase.from(pageContentTable(locale, false)).upsert({ ...localData, published_at: new Date().toISOString() } as never, { onConflict: conflict });
    if (publishError) throw new Error(`Could not publish the ${pageKey} appearance.`);
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: publish ? `website.${pageKey}.appearance_published` : `website.${pageKey}.appearance_draft_saved`, entity_type: "page_content", metadata: { page_key: pageKey, locale } });
  revalidatePath(`/${pageKey}`);
  revalidatePath(`/th/${pageKey}`);
  revalidatePath(`/admin/website/appearance/${pageKey}`);
  redirect(`/admin/website/appearance/${pageKey}?locale=${locale}&status=${publish ? "published" : "draft"}`);
}

export async function saveCollectionAppearanceDraft(formData: FormData) { await saveCollectionAppearance(formData, false); }
export async function publishCollectionAppearance(formData: FormData) { await saveCollectionAppearance(formData, true); }

export async function createSocialLink(formData: FormData) {
  const input = socialLinkSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const position = await nextWebsitePosition(supabase, "social_links");
  const { error } = await supabase.from("social_links").insert({ platform: input.platform, label: input.label || null, url: input.url, visible: input.visible, position });
  if (error) throw new Error("Could not create social link.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "social_link.created", entity_type: "social_link" });
  revalidatePath("/contact"); revalidatePath("/", "layout"); revalidatePath("/admin/website/social-links");
}

export async function updateSocialLink(id: string, formData: FormData) {
  const input = socialLinkSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("social_links").update({ platform: input.platform, label: input.label || null, url: input.url, visible: input.visible, position: input.position }).eq("id", id);
  if (error) throw new Error("Could not update social link.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "social_link.updated", entity_type: "social_link", entity_id: id });
  revalidatePath("/contact"); revalidatePath("/", "layout"); revalidatePath("/admin/website/social-links");
  redirect("/admin/website/social-links");
}

export async function deleteSocialLink(id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) throw new Error("Could not delete social link.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "social_link.deleted", entity_type: "social_link", entity_id: id });
  revalidatePath("/contact"); revalidatePath("/", "layout"); revalidatePath("/admin/website/social-links");
  redirect("/admin/website/social-links");
}

export async function saveSocialLinkOrder(formData: FormData) {
  const ids = orderedIdsFromForm(formData);
  if (!ids) redirect("/admin/website/social-links?order=error");
  const { user, supabase } = await getAdminClient();
  const { data, error } = await supabase.from("social_links").select("id").order("position");
  const currentIds = (data ?? []).map((item) => item.id as string);
  if (error || currentIds.length !== ids.length || currentIds.some((id) => !ids.includes(id))) redirect("/admin/website/social-links?order=stale");
  const updates = await Promise.all(ids.map((id, index) => supabase.from("social_links").update({ position: (index + 1) * 10 }).eq("id", id)));
  if (updates.some((result) => result.error)) redirect("/admin/website/social-links?order=error");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "social_link.reordered", entity_type: "social_link", metadata: { ids } });
  revalidatePath("/contact"); revalidatePath("/", "layout"); revalidatePath("/admin/website/social-links");
  redirect("/admin/website/social-links?order=saved");
}

export async function createNavigationItem(formData: FormData) {
  const input = navigationItemSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const groupName = "more";
  const position = await nextWebsitePosition(supabase, "navigation_items", groupName);
  const { error } = await supabase.from("navigation_items").insert({ item_key: input.itemKey, label: input.label, href: input.href, group_name: groupName, visible: input.visible, position });
  if (error) throw new Error(error.code === "23505" ? "This navigation key already exists." : "Could not create navigation item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.created", entity_type: "navigation_item", metadata: { item_key: input.itemKey } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
}

export async function updateNavigationItem(id: string, formData: FormData) {
  const input = navigationItemSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const { data: currentItem, error: currentItemError } = await supabase.from("navigation_items").select("group_name, position").eq("id", id).maybeSingle();
  if (currentItemError || !currentItem) redirect("/admin/website/navigation?order=stale");
  const { error } = await supabase.from("navigation_items").update({ item_key: input.itemKey, label: input.label, href: input.href, group_name: currentItem.group_name, visible: input.visible, position: currentItem.position }).eq("id", id);
  if (error) throw new Error(error.code === "23505" ? "This navigation key already exists." : "Could not update navigation item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.updated", entity_type: "navigation_item", entity_id: id, metadata: { item_key: input.itemKey } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
  redirect("/admin/website/navigation");
}

export async function deleteNavigationItem(id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("navigation_items").delete().eq("id", id);
  if (error) throw new Error("Could not delete navigation item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.deleted", entity_type: "navigation_item", entity_id: id });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
  redirect("/admin/website/navigation");
}

export async function saveNavigationOrder(groupName: "main" | "more", formData: FormData) {
  const ids = orderedIdsFromForm(formData);
  if (!ids || !["main", "more"].includes(groupName)) redirect("/admin/website/navigation?order=error");
  const { user, supabase } = await getAdminClient();
  const { data, error } = await supabase.from("navigation_items").select("id").eq("group_name", groupName).order("position");
  const currentIds = (data ?? []).map((item) => item.id as string);
  if (error || currentIds.length !== ids.length || currentIds.some((id) => !ids.includes(id))) redirect("/admin/website/navigation?order=stale");
  const updates = await Promise.all(ids.map((id, index) => supabase.from("navigation_items").update({ position: (index + 1) * 10 }).eq("id", id).eq("group_name", groupName)));
  if (updates.some((result) => result.error)) redirect("/admin/website/navigation?order=error");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.reordered", entity_type: "navigation_item", metadata: { group_name: groupName, ids } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
  redirect("/admin/website/navigation?order=saved");
}

export async function saveNavigationLayout(formData: FormData) {
  const parseIds = (key: string) => {
    try {
      const parsed: unknown = JSON.parse(String(formData.get(key) ?? "[]"));
      return Array.isArray(parsed) && parsed.every((id) => typeof id === "string" && uuidPattern.test(id)) && new Set(parsed).size === parsed.length ? parsed : null;
    } catch { return null; }
  };
  const mainIds = parseIds("mainIds");
  const moreIds = parseIds("moreIds");
  if (!mainIds || !moreIds || mainIds.length > 3 || new Set([...mainIds, ...moreIds]).size !== mainIds.length + moreIds.length) redirect("/admin/website/navigation?order=error");

  const { user, supabase } = await getAdminClient();
  const { data, error } = await supabase.from("navigation_items").select("id");
  const currentIds = (data ?? []).map((item) => item.id as string);
  const submittedIds = [...mainIds, ...moreIds];
  if (error || currentIds.length !== submittedIds.length || currentIds.some((id) => !submittedIds.includes(id))) redirect("/admin/website/navigation?order=stale");

  const updates = await Promise.all([
    ...mainIds.map((id, index) => supabase.from("navigation_items").update({ group_name: "main", position: (index + 1) * 10 }).eq("id", id)),
    ...moreIds.map((id, index) => supabase.from("navigation_items").update({ group_name: "more", position: (index + 1) * 10 }).eq("id", id)),
  ]);
  if (updates.some((result) => result.error)) redirect("/admin/website/navigation?order=error");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.layout_changed", entity_type: "navigation_item", metadata: { main_ids: mainIds, more_ids: moreIds } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
  redirect("/admin/website/navigation?order=saved");
}

async function saveSiteSettings(formData: FormData, publish: boolean) {
  const input = siteSettingsEditorSchema.parse(Object.fromEntries(formData));
  const content = toSiteSettingsContent(input);
  const { user, supabase } = await getAdminClient();
  const { error: draftError } = await supabase.from("page_content_drafts").upsert({ page_key: "site-settings", content }, { onConflict: "page_key" });
  if (draftError) throw new Error("Could not save the Site Settings draft.");
  if (publish) {
    const { error: publishError } = await supabase.from("page_content").upsert({ page_key: "site-settings", content, published_at: new Date().toISOString() }, { onConflict: "page_key" });
    if (publishError) throw new Error("Could not publish Site Settings.");
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: publish ? "website.site_settings.published" : "website.site_settings.draft_saved", entity_type: "page_content", metadata: { page_key: "site-settings" } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/settings");
  redirect(`/admin/website/settings?status=${publish ? "published" : "draft"}`);
}

export async function saveSiteSettingsDraft(formData: FormData) { await saveSiteSettings(formData, false); }
export async function publishSiteSettings(formData: FormData) { await saveSiteSettings(formData, true); }
