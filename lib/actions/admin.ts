"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import type { ProgrammeSection } from "@/lib/queries/programme";
import { createClient } from "@/lib/supabase/server";
import { concertSchema, gallerySchema, programmeSchema, repertoireSchema } from "@/lib/validations/content";

async function getAdminClient() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return { user, supabase: await createClient() };
}

type PublishableTable = "concerts" | "galleries" | "news" | "events" | "artists" | "repertoire";

async function publishedAtForUpdate(supabase: Awaited<ReturnType<typeof createClient>>, table: PublishableTable, id: string, status: "draft" | "published" | "archived") {
  if (status !== "published") return null;
  const { data, error } = await supabase.from(table).select("published_at").eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Could not find this record.");
  return (data.published_at as string | null) ?? new Date().toISOString();
}

function revalidateProgramme(section: ProgrammeSection) {
  revalidatePath("/");
  revalidatePath(`/admin/${section}`);
  revalidatePath(`/${section}`);
  if (section === "news" || section === "events" || section === "artists") revalidatePath(`/${section}/[slug]`, "page");
}

function ctaValues(input: { ctaLabel?: string; ctaUrl?: string }) {
  const url = input.ctaUrl?.trim() || null;
  return { cta_label: url ? input.ctaLabel?.trim() || "Learn more" : null, cta_url: url };
}

export async function createConcert(formData: FormData) {
  const input = concertSchema.parse(Object.fromEntries(formData));
  const cta = ctaValues(input);
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { error } = await supabase.from("concerts").insert({
    title: input.title, slug: input.slug, description: input.description, venue: input.venue,
    display_date: input.displayDate, starts_at: input.startsAt || null, status: input.status, published_at: publishedAt,
    ...cta,
  });
  if (error) throw new Error("Could not create concert.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "concert.created", entity_type: "concert" });
  revalidatePath("/"); revalidatePath("/concerts"); revalidatePath("/admin/concerts");
}

export async function updateConcert(id: string, formData: FormData) {
  const input = concertSchema.parse(Object.fromEntries(formData));
  const cta = ctaValues(input);
  const { user, supabase } = await getAdminClient();
  const publishedAt = await publishedAtForUpdate(supabase, "concerts", id, input.status);
  const { error } = await supabase.from("concerts").update({ title: input.title, slug: input.slug, description: input.description, venue: input.venue, display_date: input.displayDate, starts_at: input.startsAt || null, status: input.status, published_at: publishedAt, ...cta }).eq("id", id);
  if (error) throw new Error("Could not update concert.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "concert.updated", entity_type: "concert", entity_id: id });
  revalidatePath("/"); revalidatePath("/concerts"); revalidatePath("/admin/concerts");
  redirect("/admin/concerts");
}

export async function deleteConcert(id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("concerts").delete().eq("id", id);
  if (error) throw new Error("Could not delete concert.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "concert.deleted", entity_type: "concert", entity_id: id });
  revalidatePath("/"); revalidatePath("/concerts"); revalidatePath("/admin/concerts");
  redirect("/admin/concerts");
}

export async function createGallery(formData: FormData) {
  const input = gallerySchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { error } = await supabase.from("galleries").insert({ title: input.title, slug: input.slug, description: input.description || null, status: input.status, published_at: publishedAt });
  if (error) throw new Error("Could not create gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.created", entity_type: "gallery" });
  revalidatePath("/gallery"); revalidatePath("/admin/galleries");
}

export async function updateGallery(id: string, formData: FormData) {
  const input = gallerySchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = await publishedAtForUpdate(supabase, "galleries", id, input.status);
  const { error } = await supabase.from("galleries").update({ title: input.title, slug: input.slug, description: input.description || null, status: input.status, published_at: publishedAt }).eq("id", id);
  if (error) throw new Error("Could not update gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.updated", entity_type: "gallery", entity_id: id });
  revalidatePath("/gallery"); revalidatePath("/admin/galleries");
  redirect("/admin/galleries");
}

export async function deleteGallery(id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("galleries").delete().eq("id", id);
  if (error) throw new Error("Could not delete gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.deleted", entity_type: "gallery", entity_id: id });
  revalidatePath("/gallery"); revalidatePath("/admin/galleries");
  redirect("/admin/galleries");
}

export async function addImageToGallery(galleryId: string, formData: FormData) {
  const mediaAssetId = String(formData.get("mediaAssetId") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mediaAssetId)) throw new Error("Select an image from Media first.");
  const { user, supabase } = await getAdminClient();
  const { data: latest, error: positionError } = await supabase.from("gallery_items").select("position").eq("gallery_id", galleryId).order("position", { ascending: false }).limit(1).maybeSingle();
  if (positionError) throw new Error("Could not prepare the gallery image.");
  const { error } = await supabase.from("gallery_items").insert({ gallery_id: galleryId, media_asset_id: mediaAssetId, position: ((latest?.position as number | undefined) ?? -10) + 10 });
  if (error) throw new Error(error.code === "23505" ? "This image is already in the gallery." : "Could not add the image to this gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.image_added", entity_type: "gallery", entity_id: galleryId, metadata: { media_asset_id: mediaAssetId } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`); revalidatePath("/admin/media");
}

export async function removeImageFromGallery(galleryId: string, galleryItemId: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", galleryItemId).eq("gallery_id", galleryId);
  if (error) throw new Error("Could not remove the image from this gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.image_removed", entity_type: "gallery", entity_id: galleryId, metadata: { gallery_item_id: galleryItemId } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`); revalidatePath("/admin/media");
}

export async function createRepertoire(formData: FormData) {
  const input = repertoireSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { error } = await supabase.from("repertoire").insert({ title: input.title, slug: input.slug, composer: input.composer || null, arranger: input.arranger || null, instrumentation: input.instrumentation || null, notes: input.notes || null, cover_media_id: input.coverMediaId || null, youtube_url: input.youtubeUrl || null, status: input.status, published_at: publishedAt });
  if (error) throw new Error("Could not create repertoire item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "repertoire.created", entity_type: "repertoire" });
  revalidatePath("/repertoire"); revalidatePath("/admin/repertoire");
}

export async function updateRepertoire(id: string, formData: FormData) {
  const input = repertoireSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = await publishedAtForUpdate(supabase, "repertoire", id, input.status);
  const { error } = await supabase.from("repertoire").update({ title: input.title, slug: input.slug, composer: input.composer || null, arranger: input.arranger || null, instrumentation: input.instrumentation || null, notes: input.notes || null, cover_media_id: input.coverMediaId || null, youtube_url: input.youtubeUrl || null, status: input.status, published_at: publishedAt }).eq("id", id);
  if (error) throw new Error("Could not update repertoire item.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "repertoire.updated", entity_type: "repertoire", entity_id: id });
  revalidatePath("/repertoire"); revalidatePath("/repertoire/[slug]", "page"); revalidatePath("/admin/repertoire");
  redirect("/admin/repertoire");
}

export async function deleteRepertoire(id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("repertoire").delete().eq("id", id);
  if (error) throw new Error("Could not delete repertoire item. It may be linked to an event.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "repertoire.deleted", entity_type: "repertoire", entity_id: id });
  revalidatePath("/repertoire"); revalidatePath("/admin/repertoire");
  redirect("/admin/repertoire");
}

const acceptedMediaTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSizeBytes = 20 * 1024 * 1024;
const managedObjectPath = /^uploads\/[0-9a-f-]{36}\.(jpg|png|webp)$/i;

export type UploadedMediaInput = { objectPath: string; mimeType: string; sizeBytes: number; altText: string; caption: string };
export type UploadedMediaResult = { ok: boolean; message: string };

export async function registerUploadedMedia(input: UploadedMediaInput): Promise<UploadedMediaResult> {
  const altText = input.altText.trim();
  const caption = input.caption.trim();
  if (!managedObjectPath.test(input.objectPath) || !acceptedMediaTypes.has(input.mimeType)) return { ok: false, message: "รูปภาพนี้ไม่ผ่านการตรวจสอบ กรุณาลองอัปโหลดใหม่" };
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxImageSizeBytes) return { ok: false, message: "ไฟล์รูปต้องมีขนาดไม่เกิน 20 MB" };
  if (!altText || altText.length > 500 || caption.length > 2000) return { ok: false, message: "กรุณาตรวจคำอธิบายรูปภาพและคำบรรยาย" };

  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_assets").insert({ bucket_id: "public-media", object_path: input.objectPath, mime_type: input.mimeType, size_bytes: input.sizeBytes, alt_text: altText, caption: caption || null, is_public: true });
  if (error) return { ok: false, message: "บันทึกข้อมูลรูปไม่สำเร็จ กรุณาลองใหม่" };
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.uploaded", entity_type: "media_asset", metadata: { object_path: input.objectPath } });
  revalidatePath("/admin/media");
  return { ok: true, message: "อัปโหลดรูปสำเร็จแล้ว สามารถนำไปใช้กับ Gallery, Logo หรือภาพพื้นหลังได้" };
}

export async function updateMedia(id: string, formData: FormData) {
  const altText = String(formData.get("altText") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  if (!altText || altText.length > 500 || caption.length > 2000) throw new Error("Check the image description and caption.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_assets").update({ alt_text: altText, caption: caption || null }).eq("id", id);
  if (error) throw new Error("Could not update image details.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.updated", entity_type: "media_asset", entity_id: id });
  revalidatePath("/", "layout"); revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath("/repertoire"); revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function deleteMedia(id: string) {
  const { user, supabase } = await getAdminClient();
  const [galleryUsage, concertUsage, repertoireUsage, pageContent, pageContentDrafts, localizedContent, localizedContentDrafts] = await Promise.all([
    supabase.from("gallery_items").select("id", { count: "exact", head: true }).eq("media_asset_id", id),
    supabase.from("concerts").select("id", { count: "exact", head: true }).eq("cover_media_id", id),
    supabase.from("repertoire").select("id", { count: "exact", head: true }).eq("cover_media_id", id),
    supabase.from("page_content").select("page_key,content"),
    supabase.from("page_content_drafts").select("page_key,content"),
    supabase.from("page_content_localizations").select("page_key,locale,content"),
    supabase.from("page_content_localization_drafts").select("page_key,locale,content"),
  ]);
  if (galleryUsage.error || concertUsage.error || repertoireUsage.error || pageContent.error || pageContentDrafts.error || localizedContent.error || localizedContentDrafts.error) throw new Error("Could not check whether this image is in use.");
  const pageRecords = [...(pageContent.data ?? []), ...(pageContentDrafts.data ?? []), ...(localizedContent.data ?? []), ...(localizedContentDrafts.data ?? [])];
  const isUsedInPageSettings = pageRecords.some((record) => JSON.stringify(record.content).includes(`\"${id}\"`));
  if ((galleryUsage.count ?? 0) > 0) throw new Error("Remove this image from its gallery before deleting it.");
  if ((concertUsage.count ?? 0) > 0 || (repertoireUsage.count ?? 0) > 0) throw new Error("Remove this image from the content item that uses it before deleting it.");
  if (isUsedInPageSettings) throw new Error("Remove this image from Home, About, or Site Settings before deleting it.");
  const { data, error } = await supabase.from("media_assets").delete().eq("id", id).select("bucket_id,object_path").maybeSingle();
  if (error || !data) throw new Error("Could not delete image details.");
  const { error: storageError } = await supabase.storage.from(data.bucket_id as string).remove([data.object_path as string]);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.deleted", entity_type: "media_asset", entity_id: id, metadata: { object_path: data.object_path, storage_cleanup: !storageError } });
  revalidatePath("/", "layout"); revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath("/repertoire"); revalidatePath("/admin/media");
  redirect("/admin/media");
}

export async function createProgrammeItem(formData: FormData) {
  const input = programmeSchema.parse(Object.fromEntries(formData));
  const cta = ctaValues(input);
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let error: Error | null = null;
  if (input.contentType === "news") ({ error } = await supabase.from("news").insert({ title: input.title, slug, excerpt: input.summary || "", body: input.summary || "", status: input.status, published_at: publishedAt, ...cta }));
  if (input.contentType === "events") ({ error } = await supabase.from("events").insert({ title: input.title, slug, description: input.summary || "", venue: input.meta || null, starts_at: input.dateTime || null, status: input.status, published_at: publishedAt, ...cta }));
  if (input.contentType === "artists") ({ error } = await supabase.from("artists").insert({ name: input.title, slug, biography: input.summary || "", status: input.status, published_at: publishedAt, ...cta }));
  if (input.contentType === "repertoire") ({ error } = await supabase.from("repertoire").insert({ title: input.title, composer: input.meta || null, notes: input.summary || null, status: input.status }));
  if (input.contentType === "members") ({ error } = await supabase.from("members").insert({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }));
  if (input.contentType === "alumni") ({ error } = await supabase.from("alumni").insert({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }));
  if (error) throw new Error("Could not create content.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: `${input.contentType}.created`, entity_type: input.contentType });
  revalidatePath(`/${input.contentType}`); revalidatePath(`/admin/${input.contentType}`);
}

export async function updateProgrammeItem(contentType: ProgrammeSection, id: string, formData: FormData) {
  const input = programmeSchema.parse({ ...Object.fromEntries(formData), contentType });
  const cta = ctaValues(input);
  const { user, supabase } = await getAdminClient();
  let error: Error | null = null;

  if (contentType === "news") {
    const publishedAt = await publishedAtForUpdate(supabase, "news", id, input.status);
    ({ error } = await supabase.from("news").update({ title: input.title, slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), excerpt: input.summary || "", body: input.summary || "", status: input.status, published_at: publishedAt, ...cta }).eq("id", id));
  }
  if (contentType === "events") {
    const publishedAt = await publishedAtForUpdate(supabase, "events", id, input.status);
    ({ error } = await supabase.from("events").update({ title: input.title, slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), description: input.summary || "", venue: input.meta || null, starts_at: input.dateTime || null, status: input.status, published_at: publishedAt, ...cta }).eq("id", id));
  }
  if (contentType === "artists") {
    const publishedAt = await publishedAtForUpdate(supabase, "artists", id, input.status);
    ({ error } = await supabase.from("artists").update({ name: input.title, slug: input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), biography: input.summary || "", status: input.status, published_at: publishedAt, ...cta }).eq("id", id));
  }
  if (contentType === "repertoire") ({ error } = await supabase.from("repertoire").update({ title: input.title, composer: input.meta || null, notes: input.summary || null, status: input.status }).eq("id", id));
  if (contentType === "members") ({ error } = await supabase.from("members").update({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }).eq("id", id));
  if (contentType === "alumni") ({ error } = await supabase.from("alumni").update({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }).eq("id", id));

  if (error) throw new Error("Could not update content.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: `${contentType}.updated`, entity_type: contentType, entity_id: id });
  revalidateProgramme(contentType);
  redirect(`/admin/${contentType}`);
}

export async function deleteProgrammeItem(contentType: ProgrammeSection, id: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from(contentType).delete().eq("id", id);
  if (error) throw new Error("Could not delete content. It may be linked to another record.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: `${contentType}.deleted`, entity_type: contentType, entity_id: id });
  revalidateProgramme(contentType);
  redirect(`/admin/${contentType}`);
}
