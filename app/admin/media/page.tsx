export const metadata = { title: "Admin · Media" };

import Link from "next/link";
import { MediaLibrary } from "@/components/admin/media-library";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { getAdminMediaLibrary } from "@/lib/queries/admin-content";

const uploadFeedback = {
  success: { status: "success" as const, message: "อัปโหลดรูปสำเร็จแล้ว สามารถนำไปใช้กับ Gallery, Logo หรือภาพพื้นหลังได้" },
  "invalid-file": { status: "error" as const, message: "ไฟล์นี้ไม่รองรับ กรุณาใช้ JPG, PNG หรือ WebP เท่านั้น (ไฟล์ HEIC ต้องแปลงก่อน)" },
  "too-large": { status: "error" as const, message: "ไฟล์รูปต้องมีขนาดไม่เกิน 20 MB กรุณาลดขนาดก่อนอัปโหลด" },
  "missing-alt": { status: "error" as const, message: "กรุณากรอกคำอธิบายรูปภาพ (Alt text)" },
  "storage-error": { status: "error" as const, message: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
  "metadata-error": { status: "error" as const, message: "อัปโหลดไฟล์แล้ว แต่บันทึกข้อมูลรูปไม่สำเร็จ กรุณาลองใหม่" },
};

const organizationFeedback = {
  "album-updated": { status: "success" as const, message: "บันทึกการแก้ไข Album เรียบร้อยแล้ว" },
  "album-deleted": { status: "success" as const, message: "ลบ Album เรียบร้อยแล้ว รูปภาพจริงยังอยู่ใน Media เหมือนเดิม" },
  "tag-updated": { status: "success" as const, message: "บันทึกการแก้ไข Tag เรียบร้อยแล้ว" },
  "tag-deleted": { status: "success" as const, message: "ลบ Tag เรียบร้อยแล้ว รูปภาพจริงยังอยู่ใน Media เหมือนเดิม" },
  "validation-error": { status: "error" as const, message: "กรุณากรอกชื่อ Album หรือ Tag ให้ถูกต้อง" },
  "duplicate-name": { status: "error" as const, message: "มี Album หรือ Tag ชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" },
  error: { status: "error" as const, message: "ไม่สามารถบันทึกการจัดการ Album หรือ Tag ได้ในขณะนี้ กรุณาลองใหม่" },
};

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ upload?: string; organize?: string }> }) {
  const library = await getAdminMediaLibrary();
  const { upload, organize } = await searchParams;
  const feedback = upload && upload in uploadFeedback
    ? uploadFeedback[upload as keyof typeof uploadFeedback]
    : organize && organize in organizationFeedback
      ? organizationFeedback[organize as keyof typeof organizationFeedback]
      : null;
  return <><header className="admin-page-header"><p className="eyebrow">Library</p><h1>Media</h1><p>Upload reusable public images, then organize and reuse them across Gallery, Covers, Logo, and page backgrounds.</p></header><MediaUploadForm feedback={feedback} albums={library.albums} tags={library.tags} organizationAvailable={library.organizationAvailable} /><MediaLibrary {...library} /><p className="admin-media-library__note">ไฟล์จริงยังเก็บใน Media เดิมเสมอ การใส่ Album หรือ Tag เป็นเพียงการจัดระเบียบ จึงไม่เปลี่ยนลิงก์รูปที่ใช้อยู่ในเว็บไซต์</p><Link className="admin-media-library__back-link" href="/admin">กลับไปหน้ารวม Admin</Link></>;
}
