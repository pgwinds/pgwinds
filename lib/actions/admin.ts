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
  const mediaAssetIds = [...new Set(
    formData
      .getAll("mediaAssetId")
      .map((value) => String(value).trim())
      .filter((id) => uuidPattern.test(id)),
  )];
  const { user, supabase } = await getAdminClient();
  if (mediaAssetIds.length === 0) redirect(`/admin/galleries/${galleryId}?image=select-required`);
  const { data: existingItems, error: positionError } = await supabase
    .from("gallery_items")
    .select("media_asset_id,position")
    .eq("gallery_id", galleryId)
    .order("position", { ascending: false });
  if (positionError) redirect(`/admin/galleries/${galleryId}?image=error`);
  const attachedIds = new Set((existingItems ?? []).map((item) => item.media_asset_id as string));
  const newMediaIds = mediaAssetIds.filter((id) => !attachedIds.has(id));
  if (newMediaIds.length === 0) redirect(`/admin/galleries/${galleryId}?image=already-added`);
  const latestPosition = (existingItems?.[0]?.position as number | undefined) ?? -10;
  const { error } = await supabase.from("gallery_items").insert(
    newMediaIds.map((mediaAssetId, index) => ({
      gallery_id: galleryId,
      media_asset_id: mediaAssetId,
      position: latestPosition + ((index + 1) * 10),
    })),
  );
  if (error) redirect(`/admin/galleries/${galleryId}?image=error`);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.images_added", entity_type: "gallery", entity_id: galleryId, metadata: { media_asset_ids: newMediaIds } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`); revalidatePath("/admin/media");
  redirect(`/admin/galleries/${galleryId}?image=added`);
}

export async function addAlbumToGallery(galleryId: string, formData: FormData) {
  const albumId = String(formData.get("albumId") ?? "").trim();
  const { user, supabase } = await getAdminClient();
  if (!uuidPattern.test(albumId)) redirect(`/admin/galleries/${galleryId}?image=album-required`);
  const [{ data: albumItems, error: albumError }, { data: galleryItems, error: galleryError }] = await Promise.all([
    supabase.from("media_album_items").select("media_asset_id").eq("album_id", albumId),
    supabase.from("gallery_items").select("media_asset_id,position").eq("gallery_id", galleryId).order("position", { ascending: false }),
  ]);
  if (albumError || galleryError) redirect(`/admin/galleries/${galleryId}?image=error`);
  const attachedIds = new Set((galleryItems ?? []).map((item) => item.media_asset_id as string));
  const newMediaIds = (albumItems ?? []).map((item) => item.media_asset_id as string).filter((id) => !attachedIds.has(id));
  if (newMediaIds.length === 0) redirect(`/admin/galleries/${galleryId}?image=album-empty`);
  const latestPosition = (galleryItems?.[0]?.position as number | undefined) ?? -10;
  const { error } = await supabase.from("gallery_items").insert(newMediaIds.map((mediaAssetId, index) => ({ gallery_id: galleryId, media_asset_id: mediaAssetId, position: latestPosition + ((index + 1) * 10) })));
  if (error) redirect(`/admin/galleries/${galleryId}?image=error`);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.album_added", entity_type: "gallery", entity_id: galleryId, metadata: { album_id: albumId, media_asset_ids: newMediaIds } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`); revalidatePath("/admin/media");
  redirect(`/admin/galleries/${galleryId}?image=album-added`);
}

export async function removeImageFromGallery(galleryId: string, galleryItemId: string) {
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("gallery_items").delete().eq("id", galleryItemId).eq("gallery_id", galleryId);
  if (error) throw new Error("Could not remove the image from this gallery.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.image_removed", entity_type: "gallery", entity_id: galleryId, metadata: { gallery_item_id: galleryItemId } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`); revalidatePath("/admin/media");
}

export async function moveGalleryImage(galleryId: string, galleryItemId: string, direction: "up" | "down") {
  const { user, supabase } = await getAdminClient();
  if (!uuidPattern.test(galleryId) || !uuidPattern.test(galleryItemId) || !["up", "down"].includes(direction)) {
    redirect(`/admin/galleries/${galleryId}?order=error`);
  }

  const { data: items, error: itemsError } = await supabase
    .from("gallery_items")
    .select("id,position")
    .eq("gallery_id", galleryId)
    .order("position");
  if (itemsError || !items) redirect(`/admin/galleries/${galleryId}?order=error`);

  const currentIndex = items.findIndex((item) => item.id === galleryItemId);
  const adjacentIndex = currentIndex + (direction === "up" ? -1 : 1);
  const current = items[currentIndex];
  const adjacent = items[adjacentIndex];
  if (!current || !adjacent) redirect(`/admin/galleries/${galleryId}?order=unchanged`);

  const currentPosition = current.position as number;
  const adjacentPosition = adjacent.position as number;
  const temporaryPosition = Math.max(...items.map((item) => item.position as number)) + 10;
  const fail = () => redirect(`/admin/galleries/${galleryId}?order=error`);

  const { error: liftError } = await supabase
    .from("gallery_items")
    .update({ position: temporaryPosition })
    .eq("id", galleryItemId)
    .eq("gallery_id", galleryId);
  if (liftError) fail();

  const { error: adjacentError } = await supabase
    .from("gallery_items")
    .update({ position: currentPosition })
    .eq("id", adjacent.id)
    .eq("gallery_id", galleryId);
  if (adjacentError) {
    await supabase.from("gallery_items").update({ position: currentPosition }).eq("id", galleryItemId).eq("gallery_id", galleryId);
    fail();
  }

  const { error: placeError } = await supabase
    .from("gallery_items")
    .update({ position: adjacentPosition })
    .eq("id", galleryItemId)
    .eq("gallery_id", galleryId);
  if (placeError) {
    await supabase.from("gallery_items").update({ position: adjacentPosition }).eq("id", adjacent.id).eq("gallery_id", galleryId);
    await supabase.from("gallery_items").update({ position: currentPosition }).eq("id", galleryItemId).eq("gallery_id", galleryId);
    fail();
  }

  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.image_reordered", entity_type: "gallery", entity_id: galleryId, metadata: { gallery_item_id: galleryItemId, direction, from_position: currentPosition, to_position: adjacentPosition } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`);
  redirect(`/admin/galleries/${galleryId}?order=moved`);
}

export async function saveGalleryImageOrder(galleryId: string, formData: FormData) {
  const rawOrder = String(formData.get("galleryItemIds") ?? "");
  let galleryItemIds: string[];
  try {
    const parsed: unknown = JSON.parse(rawOrder);
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== "string" || !uuidPattern.test(id))) throw new Error("invalid order");
    galleryItemIds = parsed;
  } catch {
    redirect(`/admin/galleries/${galleryId}?order=error`);
  }
  if (!uuidPattern.test(galleryId) || galleryItemIds.length === 0 || new Set(galleryItemIds).size !== galleryItemIds.length) redirect(`/admin/galleries/${galleryId}?order=error`);

  const { user, supabase } = await getAdminClient();
  const { data: items, error: itemsError } = await supabase
    .from("gallery_items")
    .select("id,position")
    .eq("gallery_id", galleryId)
    .order("position");
  if (itemsError || !items) redirect(`/admin/galleries/${galleryId}?order=error`);

  const currentIds = items.map((item) => item.id as string);
  if (currentIds.length !== galleryItemIds.length || currentIds.some((id) => !galleryItemIds.includes(id))) redirect(`/admin/galleries/${galleryId}?order=stale`);

  const maximumPosition = Math.max(...items.map((item) => item.position as number));
  const setPositions = async (orderedIds: string[], startingAt: number) => Promise.all(
    orderedIds.map((id, index) => supabase.from("gallery_items").update({ position: startingAt + ((index + 1) * 10) }).eq("id", id).eq("gallery_id", galleryId)),
  );
  const restoreOriginalOrder = async () => {
    const recoveryStart = maximumPosition + ((items.length + 2) * 20);
    await setPositions(currentIds, recoveryStart);
    await Promise.all(items.map((item) => supabase.from("gallery_items").update({ position: item.position as number }).eq("id", item.id as string).eq("gallery_id", galleryId)));
  };

  const temporaryStart = maximumPosition + ((items.length + 1) * 10);
  const temporaryResults = await setPositions(currentIds, temporaryStart);
  if (temporaryResults.some((result) => result.error)) {
    await restoreOriginalOrder();
    redirect(`/admin/galleries/${galleryId}?order=error`);
  }

  const finalResults = await Promise.all(galleryItemIds.map((id, index) => supabase.from("gallery_items").update({ position: index * 10 }).eq("id", id).eq("gallery_id", galleryId)));
  if (finalResults.some((result) => result.error)) {
    await restoreOriginalOrder();
    redirect(`/admin/galleries/${galleryId}?order=error`);
  }

  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "gallery.images_reordered", entity_type: "gallery", entity_id: galleryId, metadata: { gallery_item_ids: galleryItemIds } });
  revalidatePath("/gallery"); revalidatePath("/th/gallery"); revalidatePath(`/admin/galleries/${galleryId}`);
  redirect(`/admin/galleries/${galleryId}?order=saved`);
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

export type UploadedMediaInput = { objectPath: string; mimeType: string; sizeBytes: number; altText: string; caption: string; albumId?: string; tagId?: string };
export type UploadedMediaResult = { ok: boolean; message: string };

export async function registerUploadedMedia(input: UploadedMediaInput): Promise<UploadedMediaResult> {
  const altText = input.altText.trim();
  const caption = input.caption.trim();
  const albumId = input.albumId?.trim() || null;
  const tagId = input.tagId?.trim() || null;
  if (!managedObjectPath.test(input.objectPath) || !acceptedMediaTypes.has(input.mimeType)) return { ok: false, message: "รูปภาพนี้ไม่ผ่านการตรวจสอบ กรุณาลองอัปโหลดใหม่" };
  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > maxImageSizeBytes) return { ok: false, message: "ไฟล์รูปต้องมีขนาดไม่เกิน 20 MB" };
  if (!altText || altText.length > 500 || caption.length > 2000) return { ok: false, message: "กรุณาตรวจคำอธิบายรูปภาพและคำบรรยาย" };
  if ((albumId && !uuidPattern.test(albumId)) || (tagId && !uuidPattern.test(tagId))) return { ok: false, message: "Album หรือ Tag ที่เลือกไม่ถูกต้อง กรุณาเลือกใหม่" };

  const { user, supabase } = await getAdminClient();
  const [albumResult, tagResult] = await Promise.all([
    albumId ? supabase.from("media_albums").select("id").eq("id", albumId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    tagId ? supabase.from("media_tags").select("id").eq("id", tagId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if ((albumId && (albumResult.error || !albumResult.data)) || (tagId && (tagResult.error || !tagResult.data))) return { ok: false, message: "ไม่พบ Album หรือ Tag ที่เลือก กรุณารีเฟรชหน้าแล้วเลือกใหม่" };

  const { data: media, error } = await supabase.from("media_assets").insert({ bucket_id: "public-media", object_path: input.objectPath, mime_type: input.mimeType, size_bytes: input.sizeBytes, alt_text: altText, caption: caption || null, is_public: true }).select("id").single();
  if (error || !media) return { ok: false, message: "บันทึกข้อมูลรูปไม่สำเร็จ กรุณาลองใหม่" };

  const assignments = await Promise.all([
    albumId ? supabase.from("media_album_items").insert({ album_id: albumId, media_asset_id: media.id as string }) : Promise.resolve({ error: null }),
    tagId ? supabase.from("media_asset_tags").insert({ tag_id: tagId, media_asset_id: media.id as string }) : Promise.resolve({ error: null }),
  ]);
  const organizationFailed = assignments.some((result) => result.error);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.uploaded", entity_type: "media_asset", entity_id: media.id as string, metadata: { object_path: input.objectPath, album_id: albumId, tag_id: tagId, organization_failed: organizationFailed } });
  revalidatePath("/admin/media");
  return { ok: true, message: organizationFailed ? "อัปโหลดรูปสำเร็จ แต่จัด Album หรือ Tag ไม่สำเร็จ สามารถจัดจากคลังรูปด้านล่างได้" : "อัปโหลดรูปสำเร็จแล้ว สามารถนำไปใช้กับ Gallery, Logo หรือภาพพื้นหลังได้" };
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mediaIdsFromForm(formData: FormData) {
  return [...new Set(formData.getAll("mediaAssetId").map(String).filter((id) => uuidPattern.test(id)))];
}

export async function createMediaAlbum(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name || name.length > 120 || description.length > 1000) throw new Error("Check the album name and description.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_albums").insert({ name, description: description || null });
  if (error) throw new Error(error.code === "23505" ? "An album with this name already exists." : "Could not create the album.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.album_created", entity_type: "media_album", metadata: { name } });
  revalidatePath("/admin/media");
}

export async function createMediaTag(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 60) throw new Error("Check the tag name.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_tags").insert({ name });
  if (error) throw new Error(error.code === "23505" ? "This tag already exists." : "Could not create the tag.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.tag_created", entity_type: "media_tag", metadata: { name } });
  revalidatePath("/admin/media");
}

export async function updateMediaAlbum(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!uuidPattern.test(id) || !name || name.length > 120 || description.length > 1000) redirect("/admin/media?organize=validation-error");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_albums").update({ name, description: description || null }).eq("id", id);
  if (error) redirect(`/admin/media?organize=${error.code === "23505" ? "duplicate-name" : "error"}`);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.album_updated", entity_type: "media_album", entity_id: id, metadata: { name } });
  revalidatePath("/admin/media");
  redirect("/admin/media?organize=album-updated");
}

export async function deleteMediaAlbum(id: string) {
  if (!uuidPattern.test(id)) redirect("/admin/media?organize=error");
  const { user, supabase } = await getAdminClient();
  const { data, error } = await supabase.from("media_albums").delete().eq("id", id).select("name").maybeSingle();
  if (error || !data) redirect("/admin/media?organize=error");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.album_deleted", entity_type: "media_album", entity_id: id, metadata: { name: data.name as string } });
  revalidatePath("/admin/media");
  redirect("/admin/media?organize=album-deleted");
}

export async function updateMediaTag(id: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!uuidPattern.test(id) || !name || name.length > 60) redirect("/admin/media?organize=validation-error");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_tags").update({ name }).eq("id", id);
  if (error) redirect(`/admin/media?organize=${error.code === "23505" ? "duplicate-name" : "error"}`);
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.tag_updated", entity_type: "media_tag", entity_id: id, metadata: { name } });
  revalidatePath("/admin/media");
  redirect("/admin/media?organize=tag-updated");
}

export async function deleteMediaTag(id: string) {
  if (!uuidPattern.test(id)) redirect("/admin/media?organize=error");
  const { user, supabase } = await getAdminClient();
  const { data, error } = await supabase.from("media_tags").delete().eq("id", id).select("name").maybeSingle();
  if (error || !data) redirect("/admin/media?organize=error");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.tag_deleted", entity_type: "media_tag", entity_id: id, metadata: { name: data.name as string } });
  revalidatePath("/admin/media");
  redirect("/admin/media?organize=tag-deleted");
}

export async function addMediaToAlbum(formData: FormData) {
  const albumId = String(formData.get("albumId") ?? "").trim();
  const mediaAssetIds = mediaIdsFromForm(formData);
  if (!uuidPattern.test(albumId) || mediaAssetIds.length === 0) throw new Error("Choose an album and at least one image.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_album_items").upsert(mediaAssetIds.map((mediaAssetId) => ({ album_id: albumId, media_asset_id: mediaAssetId })), { onConflict: "album_id,media_asset_id", ignoreDuplicates: true });
  if (error) throw new Error("Could not add the selected images to this album.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.album_items_added", entity_type: "media_album", entity_id: albumId, metadata: { media_asset_ids: mediaAssetIds } });
  revalidatePath("/admin/media");
}

export async function removeMediaFromAlbum(formData: FormData) {
  const albumId = String(formData.get("albumId") ?? "").trim();
  const mediaAssetIds = mediaIdsFromForm(formData);
  if (!uuidPattern.test(albumId) || mediaAssetIds.length === 0) throw new Error("Choose an album and at least one image.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_album_items").delete().eq("album_id", albumId).in("media_asset_id", mediaAssetIds);
  if (error) throw new Error("Could not remove the selected images from this album.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.album_items_removed", entity_type: "media_album", entity_id: albumId, metadata: { media_asset_ids: mediaAssetIds } });
  revalidatePath("/admin/media");
}

export async function addTagsToMedia(formData: FormData) {
  const tagId = String(formData.get("tagId") ?? "").trim();
  const mediaAssetIds = mediaIdsFromForm(formData);
  if (!uuidPattern.test(tagId) || mediaAssetIds.length === 0) throw new Error("Choose a tag and at least one image.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_asset_tags").upsert(mediaAssetIds.map((mediaAssetId) => ({ tag_id: tagId, media_asset_id: mediaAssetId })), { onConflict: "media_asset_id,tag_id", ignoreDuplicates: true });
  if (error) throw new Error("Could not tag the selected images.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.tags_added", entity_type: "media_tag", entity_id: tagId, metadata: { media_asset_ids: mediaAssetIds } });
  revalidatePath("/admin/media");
}

export async function removeTagsFromMedia(formData: FormData) {
  const tagId = String(formData.get("tagId") ?? "").trim();
  const mediaAssetIds = mediaIdsFromForm(formData);
  if (!uuidPattern.test(tagId) || mediaAssetIds.length === 0) throw new Error("Choose a tag and at least one image.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_asset_tags").delete().eq("tag_id", tagId).in("media_asset_id", mediaAssetIds);
  if (error) throw new Error("Could not remove this tag from the selected images.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.tags_removed", entity_type: "media_tag", entity_id: tagId, metadata: { media_asset_ids: mediaAssetIds } });
  revalidatePath("/admin/media");
}

export async function updateMedia(id: string, formData: FormData) {
  const altText = String(formData.get("altText") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  const focalX = Number(formData.get("focalX"));
  const focalY = Number(formData.get("focalY"));
  if (!altText || altText.length > 500 || caption.length > 2000) throw new Error("Check the image description and caption.");
  if (!Number.isInteger(focalX) || !Number.isInteger(focalY) || focalX < 0 || focalX > 100 || focalY < 0 || focalY > 100) throw new Error("Choose a valid focal point on the image.");
  const { user, supabase } = await getAdminClient();
  const { error } = await supabase.from("media_assets").update({ alt_text: altText, caption: caption || null, focal_x: focalX, focal_y: focalY }).eq("id", id);
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
