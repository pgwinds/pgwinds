"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUploadedMedia } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";

const extensionToMimeType = new Map([["jpg", "image/jpeg"], ["jpeg", "image/jpeg"], ["png", "image/png"], ["webp", "image/webp"]]);
const mimeTypeToExtension = new Map([["image/jpeg", "jpg"], ["image/jpg", "jpg"], ["image/pjpeg", "jpg"], ["image/png", "png"], ["image/x-png", "png"], ["image/webp", "webp"]]);
const maxImageSizeBytes = 20 * 1024 * 1024;
type Feedback = { status: "success" | "error"; message: string } | null;
type ImageDetails = { file: File; extension: string; mimeType: string } | { error: string };

function getImageDetails(file: File | undefined): ImageDetails {
  if (!file) return { error: "กรุณาเลือกไฟล์รูปภาพก่อนอัปโหลด" };
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const mappedExtension = mimeTypeToExtension.get(file.type);
  const mimeType = mappedExtension ? extensionToMimeType.get(mappedExtension) : extensionToMimeType.get(extension);
  if (!mimeType) return { error: "ไฟล์นี้ไม่รองรับ กรุณาใช้ JPG, PNG หรือ WebP เท่านั้น (ไฟล์ HEIC ต้องแปลงก่อน)" };
  if (file.size === 0) return { error: "ไฟล์รูปภาพว่างเปล่า กรุณาเลือกไฟล์ใหม่" };
  if (file.size > maxImageSizeBytes) return { error: "ไฟล์มีขนาดใหญ่เกิน 20 MB กรุณาลดขนาดหรือบีบอัดรูปก่อน" };
  return { file, extension: mappedExtension ?? (extension === "jpeg" ? "jpg" : extension), mimeType };
}

export function MediaUploadForm({ feedback }: { feedback: Feedback }) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Feedback>(null);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const result = getImageDetails(event.target.files?.[0]);
    setFileError("error" in result ? result.error : null);
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = getImageDetails(formData.get("file") instanceof File ? formData.get("file") as File : undefined);
    if ("error" in result) { setFileError(result.error); return; }
    const altText = String(formData.get("altText") ?? "").trim();
    const caption = String(formData.get("caption") ?? "").trim();
    if (!altText) { setSubmission({ status: "error", message: "กรุณากรอกคำอธิบายรูปภาพ (Alt text)" }); return; }

    setPending(true); setSubmission(null);
    const supabase = createClient();
    let objectPath: string | null = null;
    try {
      objectPath = `uploads/${crypto.randomUUID()}.${result.extension}`;
      const { error: uploadError } = await supabase.storage.from("public-media").upload(objectPath, result.file, { contentType: result.mimeType, upsert: false });
      if (uploadError) { setSubmission({ status: "error", message: `อัปโหลดรูปไม่สำเร็จ: ${uploadError.message}` }); return; }

      const saved = await registerUploadedMedia({ objectPath, mimeType: result.mimeType, sizeBytes: result.file.size, altText, caption });
      if (!saved.ok) {
        await supabase.storage.from("public-media").remove([objectPath]);
        setSubmission({ status: "error", message: saved.message }); return;
      }
      formRef.current?.reset(); setFileError(null); setSubmission({ status: "success", message: saved.message }); router.refresh();
    } catch {
      if (objectPath) await supabase.storage.from("public-media").remove([objectPath]);
      setSubmission({ status: "error", message: "อัปโหลดไม่สำเร็จจากการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setPending(false);
    }
  };
  const shown = fileError ? { status: "error" as const, message: fileError } : submission ?? feedback;

  return <form className="admin-editor" onSubmit={handleSubmit} ref={formRef}><label className="admin-editor__wide">Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" required disabled={pending} onChange={handleFileChange} aria-describedby="image-upload-help" /></label><label className="admin-editor__wide">Alt text<input name="altText" required disabled={pending} /></label><label className="admin-editor__wide">Caption (optional)<textarea name="caption" rows={4} disabled={pending} /></label><p className="admin-editor__wide admin-help" id="image-upload-help">อัปโหลดตรงเข้า Supabase Storage: รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 20 MB หากเป็น HEIC ให้แปลงเป็น JPG หรือ PNG ก่อน</p>{shown && <p className={`admin-editor__wide admin-form-feedback is-${shown.status}`} role={shown.status === "error" ? "alert" : "status"}>{shown.message}</p>}<button className="button" type="submit" disabled={pending || Boolean(fileError)}>{pending ? "กำลังอัปโหลด…" : "อัปโหลดรูป"}</button></form>;
}
