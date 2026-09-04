export const metadata = { title: "Admin · Media" };

import Link from "next/link";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { getAdminMediaAssets } from "@/lib/queries/admin-content";

const uploadFeedback = {
  success: { status: "success" as const, message: "อัปโหลดรูปสำเร็จแล้ว สามารถนำไปใช้กับ Gallery, Logo หรือภาพพื้นหลังได้" },
  "invalid-file": { status: "error" as const, message: "ไฟล์นี้ไม่รองรับ กรุณาใช้ JPG, PNG หรือ WebP เท่านั้น (ไฟล์ HEIC ต้องแปลงก่อน)" },
  "too-large": { status: "error" as const, message: "ไฟล์รูปต้องมีขนาดไม่เกิน 20 MB กรุณาลดขนาดก่อนอัปโหลด" },
  "missing-alt": { status: "error" as const, message: "กรุณากรอกคำอธิบายรูปภาพ (Alt text)" },
  "storage-error": { status: "error" as const, message: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
  "metadata-error": { status: "error" as const, message: "อัปโหลดไฟล์แล้ว แต่บันทึกข้อมูลรูปไม่สำเร็จ กรุณาลองใหม่" },
};

export default async function AdminMediaPage({ searchParams }: { searchParams: Promise<{ upload?: string }> }) {
  const assets = await getAdminMediaAssets();
  const { upload } = await searchParams;
  const feedback = upload && upload in uploadFeedback ? uploadFeedback[upload as keyof typeof uploadFeedback] : null;
  return <><header className="admin-page-header"><p className="eyebrow">Library</p><h1>Media</h1><p>Upload reusable public images with accessible descriptions.</p></header><MediaUploadForm feedback={feedback} /><section className="admin-records"><h2>Uploaded images</h2>{assets.length === 0 ? <p>No images yet.</p> : <div>{assets.map((asset) => <article key={asset.id}><div><strong>{asset.altText}</strong><span>{asset.objectPath} · {Math.ceil(asset.sizeBytes / 1024)} KB</span></div><div className="admin-record-actions"><Link href={`/admin/media/${asset.id}`}>Edit</Link></div></article>)}</div>}</section></>;
}
