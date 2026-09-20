"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUploadedMedia } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import type { AdminMediaAlbum, AdminMediaTag } from "@/lib/queries/admin-content";

const extensionToMimeType = new Map([["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]);
const mimeTypeToExtension = new Map([["image/jpeg", "jpg"], ["image/jpg", "jpg"], ["image/pjpeg", "jpg"], ["image/png", "png"], ["image/x-png", "png"], ["image/webp", "webp"]]);
const maxImageSizeBytes = 20 * 1024 * 1024;
const maxFilesPerBatch = 10;

type Feedback = { status: "success" | "error"; message: string } | null;
type ImageDetails = { file: File; extension: string; mimeType: string } | { error: string };
type UploadStatus = "ready" | "uploading" | "success" | "error";
type UploadItem = { id: string; file: File; details: ImageDetails; status: UploadStatus; message: string | null };

function getImageDetails(file: File): ImageDetails {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const mappedExtension = mimeTypeToExtension.get(file.type);
  const mimeType = mappedExtension ? extensionToMimeType.get(mappedExtension) : extensionToMimeType.get(extension);
  if (!mimeType) return { error: "ไม่รองรับ: ใช้ JPG, PNG หรือ WebP เท่านั้น" };
  if (file.size === 0) return { error: "ไฟล์ว่างเปล่า กรุณาเลือกไฟล์ใหม่" };
  if (file.size > maxImageSizeBytes) return { error: "เกิน 20 MB กรุณาลดขนาดรูปก่อน" };
  return { file, extension: mappedExtension ?? (extension === "jpeg" ? "jpg" : extension), mimeType };
}

function fileLabel(file: File) {
  return `${file.name} · ${(file.size / 1024 / 1024).toFixed(file.size >= 1024 * 1024 ? 1 : 2)} MB`;
}

function defaultAltText(file: File) {
  const fromName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return (fromName || "PGWINDS image").slice(0, 500);
}

function itemId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function MediaUploadForm({ feedback, albums, tags, organizationAvailable }: { feedback: Feedback; albums: AdminMediaAlbum[]; tags: AdminMediaTag[]; organizationAvailable: boolean }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Feedback>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const readyItems = items.filter((item) => !("error" in item.details) && item.status === "ready");

  const updateItem = (id: string, update: Partial<Pick<UploadItem, "status" | "message">>) => {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...update } : item));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSubmission(null);
    const knownIds = new Set(items.map((item) => item.id));
    const additions = files.filter((file) => !knownIds.has(itemId(file)));
    if (items.length + additions.length > maxFilesPerBatch) {
      setSelectionError(`รวมแล้วเลือกได้สูงสุด ${maxFilesPerBatch} รูป กรุณาลบรูปที่ไม่ใช้ก่อน หรือแบ่งเป็นหลายชุด`);
      event.target.value = "";
      return;
    }
    setSelectionError(null);
    setItems((current) => [...current, ...additions.map((file) => {
      const details = getImageDetails(file);
      return { id: itemId(file), file, details, status: ("error" in details ? "error" : "ready") as UploadStatus, message: "error" in details ? details.error : null };
    })]);
    // Allow the same picker to be opened again to add another image.
    event.target.value = "";
  };

  const removeItem = (id: string) => setItems((current) => current.filter((item) => item.id !== id));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readyItems.length === 0) {
      setSubmission({ status: "error", message: "กรุณาเลือกรูปที่ผ่านการตรวจสอบอย่างน้อย 1 รูป" });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const sharedAltText = String(formData.get("altText") ?? "").trim();
    const caption = String(formData.get("caption") ?? "").trim();
    const albumId = String(formData.get("albumId") ?? "").trim();
    const tagId = String(formData.get("tagId") ?? "").trim();
    const selectedAlbum = albums.find((album) => album.id === albumId);
    const selectedTag = tags.find((tag) => tag.id === tagId);
    if (sharedAltText.length > 500 || caption.length > 2000) {
      setSubmission({ status: "error", message: "คำอธิบายรูปหรือคำบรรยายยาวเกินกำหนด" });
      return;
    }

    setPending(true);
    setSubmission(null);
    const supabase = createClient();
    let successful = 0;
    let failed = 0;

    for (const item of readyItems) {
      if ("error" in item.details) continue;
      const { extension, mimeType } = item.details;
      const altText = (readyItems.length === 1 && sharedAltText ? sharedAltText : sharedAltText ? `${sharedAltText} — ${defaultAltText(item.file)}` : defaultAltText(item.file)).slice(0, 500);
      const objectPath = `uploads/${crypto.randomUUID()}.${extension}`;
      updateItem(item.id, { status: "uploading", message: "กำลังอัปโหลด…" });

      try {
        const { error: uploadError } = await supabase.storage.from("public-media").upload(objectPath, item.file, { contentType: mimeType, upsert: false });
        if (uploadError) {
          failed += 1;
          updateItem(item.id, { status: "error", message: `อัปโหลดไม่สำเร็จ: ${uploadError.message}` });
          continue;
        }

        const saved = await registerUploadedMedia({ objectPath, mimeType, sizeBytes: item.file.size, altText, caption, albumId, tagId });
        if (!saved.ok) {
          await supabase.storage.from("public-media").remove([objectPath]);
          failed += 1;
          updateItem(item.id, { status: "error", message: saved.message });
          continue;
        }

        successful += 1;
        updateItem(item.id, { status: "success", message: "อัปโหลดสำเร็จ" });
      } catch {
        await supabase.storage.from("public-media").remove([objectPath]);
        failed += 1;
        updateItem(item.id, { status: "error", message: "การเชื่อมต่อขัดข้อง กรุณาลองใหม่" });
      }
    }

    formRef.current?.reset();
    if (successful > 0) router.refresh();
    // Begin a fresh batch after success; retain only failed files so the user can
    // review or remove them without consuming the next batch's allowance.
    setItems((current) => failed === 0 ? [] : current.filter((item) => item.status === "error"));
    const organizationLabel = [selectedAlbum && `Album “${selectedAlbum.name}”`, selectedTag && `Tag #${selectedTag.name}`].filter(Boolean).join(" และ ");
    setSubmission(failed === 0
      ? { status: "success", message: `อัปโหลดสำเร็จ ${successful} รูปแล้ว${organizationLabel ? ` และจัดเข้า${organizationLabel}` : ""} สามารถนำไปใช้กับ Gallery, Logo หรือภาพพื้นหลังได้` }
      : { status: "error", message: `อัปโหลดสำเร็จ ${successful} รูป และไม่สำเร็จ ${failed} รูป โปรดดูรายการด้านล่าง` });
    setPending(false);
  };

  const shown = selectionError ? { status: "error" as const, message: selectionError } : submission ?? feedback;

  return <form className="admin-editor" onSubmit={handleSubmit} ref={formRef}>
    <label className="admin-editor__wide">Choose or add images<input name="files" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple required={items.length === 0} disabled={pending} onChange={handleFileChange} aria-describedby="image-upload-help" /></label>
    <label className="admin-editor__wide">Alt text (optional)<input name="altText" disabled={pending} placeholder="เช่น Alumni Concert 2026" /></label>
    <label className="admin-editor__wide">Caption for this batch (optional)<textarea name="caption" rows={4} disabled={pending} /></label>
    {organizationAvailable && (albums.length > 0 || tags.length > 0) && <fieldset className="admin-editor__wide admin-upload-organization" disabled={pending}><legend>จัดกลุ่มรูปชุดนี้ทันที (ไม่บังคับ)</legend><p>เมื่ออัปโหลดสำเร็จ รูปทุกรูปในชุดนี้จะเข้า Album หรือ Tag ที่เลือก คุณยังแก้ไขภายหลังได้จากคลังรูปด้านล่าง</p><div>{albums.length > 0 && <label>Album<select name="albumId" defaultValue=""><option value="">ไม่จัด Album ตอนนี้</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}</select></label>}{tags.length > 0 && <label>Tag<select name="tagId" defaultValue=""><option value="">ไม่ติด Tag ตอนนี้</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label>}</div></fieldset>}
    <p className="admin-editor__wide admin-help" id="image-upload-help">เลือกพร้อมกันได้สูงสุด {maxFilesPerBatch} รูป (บน Mac กด ⌘ หรือ Shift ค้างไว้) หรือเปิดตัวเลือกนี้ซ้ำเพื่อเพิ่มทีละรูปจนรวมครบ {maxFilesPerBatch} รูป รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 20 MB ต่อรูป ระบบจะอัปโหลดเรียงทีละรูป หากรูปใดผิดพลาด รูปอื่นยังทำงานต่อได้</p>
    {items.length > 0 && <ul className="admin-editor__wide admin-upload-list" aria-live="polite">{items.map((item) => <li key={item.id} className={`is-${item.status}`}><span>{fileLabel(item.file)}</span><strong>{item.message ?? "พร้อมอัปโหลด"}</strong>{item.status === "ready" && <button type="button" className="admin-upload-list__remove" onClick={() => removeItem(item.id)} aria-label={`ลบ ${item.file.name} ออกจากรายการ`}>ลบ</button>}</li>)}</ul>}
    {shown && <p className={`admin-editor__wide admin-form-feedback is-${shown.status}`} role={shown.status === "error" ? "alert" : "status"}>{shown.message}</p>}
    <button className="button" type="submit" disabled={pending || readyItems.length === 0}>{pending ? "กำลังอัปโหลด…" : `อัปโหลด ${readyItems.length || ""} รูป`}</button>
  </form>;
}
