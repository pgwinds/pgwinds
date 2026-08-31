"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { concertSchema, gallerySchema, programmeSchema } from "@/lib/validations/content";

async function getAdminClient() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return { user, supabase: await createClient() };
}

export async function createConcert(formData: FormData) {
  const input = concertSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const { error } = await supabase.from("concerts").insert({
    title: input.title, slug: input.slug, description: input.description, venue: input.venue,
    display_date: input.displayDate, starts_at: input.startsAt || null, status: input.status, published_at: publishedAt,
  });
  if (error) throw new Error("Could not create concert.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "concert.created", entity_type: "concert" });
  revalidatePath("/"); revalidatePath("/concerts"); revalidatePath("/admin/concerts");
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

const acceptedImageTypes = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
]);
const maxImageSizeBytes = 8 * 1024 * 1024;

export async function uploadMedia(formData: FormData) {
  const file = formData.get("file");
  const altText = String(formData.get("altText") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();
  if (!(file instanceof File) || !acceptedImageTypes.has(file.type)) throw new Error("Use a JPG, PNG, or WebP image.");
  if (file.size === 0 || file.size > maxImageSizeBytes) throw new Error("Images must be no larger than 8 MB.");
  if (!altText) throw new Error("Alt text is required for every image.");

  const { user, supabase } = await getAdminClient();
  const objectPath = `uploads/${crypto.randomUUID()}.${acceptedImageTypes.get(file.type)}`;
  const { error: uploadError } = await supabase.storage.from("public-media").upload(objectPath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error("Could not upload the image.");

  const { error: metadataError } = await supabase.from("media_assets").insert({
    bucket_id: "public-media", object_path: objectPath, mime_type: file.type, size_bytes: file.size,
    alt_text: altText, caption: caption || null, is_public: true,
  });
  if (metadataError) {
    await supabase.storage.from("public-media").remove([objectPath]);
    throw new Error("Could not save image metadata.");
  }
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: "media.uploaded", entity_type: "media_asset", metadata: { object_path: objectPath } });
  revalidatePath("/admin/media");
}

export async function createProgrammeItem(formData: FormData) {
  const input = programmeSchema.parse(Object.fromEntries(formData));
  const { user, supabase } = await getAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;
  const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let error: Error | null = null;
  if (input.contentType === "news") ({ error } = await supabase.from("news").insert({ title: input.title, slug, excerpt: input.summary || "", body: input.summary || "", status: input.status, published_at: publishedAt }));
  if (input.contentType === "events") ({ error } = await supabase.from("events").insert({ title: input.title, slug, description: input.summary || "", venue: input.meta || null, starts_at: input.dateTime || null, status: input.status, published_at: publishedAt }));
  if (input.contentType === "artists") ({ error } = await supabase.from("artists").insert({ name: input.title, slug, biography: input.summary || "", status: input.status, published_at: publishedAt }));
  if (input.contentType === "repertoire") ({ error } = await supabase.from("repertoire").insert({ title: input.title, composer: input.meta || null, notes: input.summary || null, status: input.status }));
  if (input.contentType === "members") ({ error } = await supabase.from("members").insert({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }));
  if (input.contentType === "alumni") ({ error } = await supabase.from("alumni").insert({ full_name: input.title, instrument: input.meta || null, biography: input.summary || null, status: input.status }));
  if (error) throw new Error("Could not create content.");
  await supabase.from("audit_logs").insert({ actor_id: user.id, action: `${input.contentType}.created`, entity_type: input.contentType });
  revalidatePath(`/${input.contentType}`); revalidatePath(`/admin/${input.contentType}`);
}
