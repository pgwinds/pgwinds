"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/shared";
import { aboutEditorSchema, contactEditorSchema, homeEditorSchema, navigationItemSchema, siteSettingsEditorSchema, socialLinkSchema, toAboutContent, toContactContent, toHomeContent, toSiteSettingsContent } from "@/lib/validations/website";

async function getAdminClient() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return { user, supabase: await createClient() };
}

function localeFromForm(formData: FormData): Locale { return formData.get("locale") === "th" ? "th" : "en"; }
function pageContentTable(locale: Locale, draft: boolean) { if (locale === "en") return draft ? "page_content_drafts" : "page_content"; return draft ? "page_content_localization_drafts" : "page_content_localizations"; }

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

export async function createSocialLink(formData: FormData) {
  const input = socialLinkSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("social_links").insert({ platform: input.platform, label: input.label || null, url: input.url, visible: input.visible, position: input.position });
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

export async function createNavigationItem(formData: FormData) {
  const input = navigationItemSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("navigation_items").insert({ item_key: input.itemKey, label: input.label, href: input.href, group_name: input.groupName, visible: input.visible, position: input.position });
  if (error) throw new Error(error.code === "23505" ? "This navigation key already exists." : "Could not create navigation item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "navigation_item.created", entity_type: "navigation_item", metadata: { item_key: input.itemKey } });
  revalidatePath("/", "layout"); revalidatePath("/admin/website/navigation");
}

export async function updateNavigationItem(id: string, formData: FormData) {
  const input = navigationItemSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("navigation_items").update({ item_key: input.itemKey, label: input.label, href: input.href, group_name: input.groupName, visible: input.visible, position: input.position }).eq("id", id);
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
