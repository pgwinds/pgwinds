"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { addMediaToAlbum, addTagsToMedia, createMediaAlbum, createMediaTag, deleteMediaAlbum, deleteMediaTag, removeMediaFromAlbum, removeTagsFromMedia, updateMediaAlbum, updateMediaTag } from "@/lib/actions/admin";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import type { AdminMediaAlbum, AdminMediaTag, OrganizedMediaAsset } from "@/lib/queries/admin-content";

const pageSize = 24;

function formatSize(sizeBytes: number) {
  return `${(sizeBytes / 1024 / 1024).toFixed(sizeBytes >= 1024 * 1024 ? 1 : 2)} MB`;
}

function formatDate(value: string) {
  const [year = "", month = "", day = ""] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "";
}

function SelectedMediaInputs({ selectedIds }: { selectedIds: Set<string> }) {
  return <>{[...selectedIds].map((id) => <input key={id} type="hidden" name="mediaAssetId" value={id} />)}</>;
}

function BulkAssignmentForm({ title, items, fieldName, addAction, removeAction, selectedIds }: { title: string; items: Array<AdminMediaAlbum | AdminMediaTag>; fieldName: "albumId" | "tagId"; addAction: (formData: FormData) => Promise<void>; removeAction: (formData: FormData) => Promise<void>; selectedIds: Set<string> }) {
  if (items.length === 0) return null;
  if (selectedIds.size === 0) return <div className="admin-media-bulk__group"><strong>{title}</strong><span>เลือกรูปก่อนเพื่อจัดกลุ่ม</span></div>;
  return <div className="admin-media-bulk__group"><strong>{title}</strong><form action={addAction}><SelectedMediaInputs selectedIds={selectedIds} /><select name={fieldName} defaultValue="" aria-label={title}><option value="" disabled>เลือก{title}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FormSubmitButton label="เพิ่ม" pendingLabel="กำลังเพิ่ม…" /></form><form action={removeAction}><SelectedMediaInputs selectedIds={selectedIds} /><select name={fieldName} defaultValue="" aria-label={`Remove ${title}`}><option value="" disabled>เลือก{title}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FormSubmitButton className="admin-text-button" label="นำออก" pendingLabel="กำลังนำออก…" /></form></div>;
}

function MediaCollectionManagement({ assets, albums, tags }: { assets: OrganizedMediaAsset[]; albums: AdminMediaAlbum[]; tags: AdminMediaTag[] }) {
  const albumCount = (albumId: string) => assets.filter((asset) => asset.albums.some((album) => album.id === albumId)).length;
  const tagCount = (tagId: string) => assets.filter((asset) => asset.tags.some((tag) => tag.id === tagId)).length;

  return <details className="admin-media-collection-management"><summary>จัดการ Album และ Tag ที่สร้างแล้ว</summary><p>แก้ชื่อหรือคำอธิบายได้ที่นี่ การลบกลุ่มจะนำรูปออกจากกลุ่มเท่านั้น ไม่ลบไฟล์รูปจริงหรือการใช้งานรูปบนเว็บไซต์</p><div className="admin-media-collection-management__lists"><section><h3>Album ({albums.length})</h3>{albums.length === 0 ? <span>ยังไม่มี Album</span> : albums.map((album) => { const updateAction = updateMediaAlbum.bind(null, album.id); const deleteAction = deleteMediaAlbum.bind(null, album.id); return <details key={album.id} className="admin-media-collection-management__item"><summary>{album.name} · {albumCount(album.id)} รูป</summary><form action={updateAction}><label>ชื่อ Album<input name="name" defaultValue={album.name} maxLength={120} required /></label><label>คำอธิบาย (ไม่บังคับ)<input name="description" defaultValue={album.description} maxLength={1000} /></label><div className="admin-media-collection-management__actions"><FormSubmitButton label="บันทึก Album" pendingLabel="กำลังบันทึก…" /></div></form><form action={deleteAction}><FormSubmitButton className="admin-text-button" label="ลบ Album นี้" pendingLabel="กำลังลบ…" /></form></details>; })}</section><section><h3>Tag ({tags.length})</h3>{tags.length === 0 ? <span>ยังไม่มี Tag</span> : tags.map((tag) => { const updateAction = updateMediaTag.bind(null, tag.id); const deleteAction = deleteMediaTag.bind(null, tag.id); return <details key={tag.id} className="admin-media-collection-management__item"><summary>#{tag.name} · {tagCount(tag.id)} รูป</summary><form action={updateAction}><label>ชื่อ Tag<input name="name" defaultValue={tag.name} maxLength={60} required /></label><div className="admin-media-collection-management__actions"><FormSubmitButton label="บันทึก Tag" pendingLabel="กำลังบันทึก…" /></div></form><form action={deleteAction}><FormSubmitButton className="admin-text-button" label="ลบ Tag นี้" pendingLabel="กำลังลบ…" /></form></details>; })}</section></div></details>;
}

export function MediaLibrary({ assets, albums, tags, organizationAvailable }: { assets: OrganizedMediaAsset[]; albums: AdminMediaAlbum[]; tags: AdminMediaTag[]; organizationAvailable: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [albumId, setAlbumId] = useState("");
  const [tagId, setTagId] = useState("");
  const [usage, setUsage] = useState<"all" | "used" | "unused">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const filtered = useMemo(() => {
    const words = query.trim().toLocaleLowerCase();
    return assets.filter((asset) => {
      const searchable = [asset.altText, asset.caption, asset.objectPath, ...asset.albums.map((album) => album.name), ...asset.tags.map((tag) => tag.name)].join(" ").toLocaleLowerCase();
      return (!words || searchable.includes(words))
        && (!albumId || asset.albums.some((album) => album.id === albumId))
        && (!tagId || asset.tags.some((tag) => tag.id === tagId))
        && (usage === "all" || (usage === "used" ? asset.usages.length > 0 : asset.usages.length === 0));
    }).sort((left, right) => sort === "name" ? left.altText.localeCompare(right.altText) : sort === "oldest" ? left.createdAt.localeCompare(right.createdAt) : right.createdAt.localeCompare(left.createdAt));
  }, [albumId, assets, query, sort, tagId, usage]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const displayed = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = (update: () => void) => { update(); setPage(1); };
  const toggleSelected = (id: string) => setSelectedIds((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectDisplayed = () => setSelectedIds((current) => new Set([...current, ...displayed.map((asset) => asset.id)]));

  useEffect(() => setMounted(true), []);
  if (!mounted) return <section className="admin-media-library" aria-busy="true"><div className="admin-media-library__heading"><div><h2>คลังรูปภาพ</h2><p>กำลังเตรียมคลังรูปภาพ…</p></div></div></section>;

  return <section className="admin-media-library" aria-labelledby="uploaded-images-heading">
    <div className="admin-media-library__heading"><div><h2 id="uploaded-images-heading">คลังรูปภาพ</h2><p>{assets.length} รูป · แสดงครั้งละ {pageSize} รูป</p></div><Link href="/admin/media">ล้างตัวกรอง</Link></div>
    <div className="admin-media-filters"><label>ค้นหารูป<input value={query} onChange={(event) => resetPage(() => setQuery(event.target.value))} placeholder="ชื่อรูป, คำอธิบาย, Album หรือ Tag" /></label>{organizationAvailable && <><label>Album<select value={albumId} onChange={(event) => resetPage(() => setAlbumId(event.target.value))}><option value="">ทุก Album</option>{albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}</select></label><label>Tag<select value={tagId} onChange={(event) => resetPage(() => setTagId(event.target.value))}><option value="">ทุก Tag</option>{tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}</select></label></>}<label>การใช้งาน<select value={usage} onChange={(event) => resetPage(() => setUsage(event.target.value as "all" | "used" | "unused"))}><option value="all">ทั้งหมด</option><option value="used">กำลังใช้งาน</option><option value="unused">ยังไม่ได้ใช้</option></select></label><label>เรียงตาม<select value={sort} onChange={(event) => resetPage(() => setSort(event.target.value as "newest" | "oldest" | "name"))}><option value="newest">ใหม่สุด</option><option value="oldest">เก่าสุด</option><option value="name">ชื่อ A–Z</option></select></label></div>
    {organizationAvailable ? <aside className="admin-media-organizer"><div><strong>เลือกแล้ว {selectedIds.size} รูป</strong><button type="button" className="admin-text-button" onClick={selectDisplayed}>เลือกทั้งหมดในหน้านี้</button>{selectedIds.size > 0 && <button type="button" className="admin-text-button" onClick={() => setSelectedIds(new Set())}>ยกเลิกการเลือก</button>}</div><div className="admin-media-organizer__assign"><BulkAssignmentForm title="Album" items={albums} fieldName="albumId" addAction={addMediaToAlbum} removeAction={removeMediaFromAlbum} selectedIds={selectedIds} /><BulkAssignmentForm title="Tag" items={tags} fieldName="tagId" addAction={addTagsToMedia} removeAction={removeTagsFromMedia} selectedIds={selectedIds} /></div><details><summary>สร้าง Album หรือ Tag ใหม่</summary><div className="admin-media-organizer__create"><form action={createMediaAlbum}><label>ชื่อ Album<input name="name" maxLength={120} required placeholder="เช่น Alumni Concert 2026" /></label><label>คำอธิบาย (ไม่บังคับ)<input name="description" maxLength={1000} /></label><FormSubmitButton label="สร้าง Album" pendingLabel="กำลังสร้าง…" /></form><form action={createMediaTag}><label>ชื่อ Tag<input name="name" maxLength={60} required placeholder="เช่น portrait" /></label><FormSubmitButton label="สร้าง Tag" pendingLabel="กำลังสร้าง…" /></form></div></details><MediaCollectionManagement assets={assets} albums={albums} tags={tags} /></aside> : <p className="admin-form-feedback is-error">ระบบ Album และ Tag จะพร้อมใช้หลังติดตั้ง migration ของ Media Library แล้ว ส่วนค้นหา, ตัวกรองการใช้งาน และคลังภาพยังใช้งานได้ตามปกติ</p>}
    {displayed.length === 0 ? <p className="admin-empty-copy">ไม่พบรูปที่ตรงกับตัวกรองนี้</p> : <div className="admin-media-grid">{displayed.map((asset) => <article key={asset.id} className={selectedIds.has(asset.id) ? "is-selected" : ""}><label className="admin-media-grid__select"><input type="checkbox" checked={selectedIds.has(asset.id)} onChange={() => toggleSelected(asset.id)} aria-label={`เลือก ${asset.altText}`} /> เลือก</label><Image src={asset.publicUrl} alt={asset.altText} width={640} height={480} /><div className="admin-media-grid__meta"><strong>{asset.altText}</strong><span>{formatSize(asset.sizeBytes)} · {formatDate(asset.createdAt)}</span>{asset.albums.length > 0 && <p>{asset.albums.map((album) => <em key={album.id}>{album.name}</em>)}</p>}{asset.tags.length > 0 && <p>{asset.tags.map((tag) => <i key={tag.id}>#{tag.name}</i>)}</p>}{asset.usages.length > 0 ? <p className="admin-media-grid__usage">ใช้ใน: {asset.usages.join(" · ")}</p> : <p className="admin-media-grid__usage">ยังไม่ได้ใช้ในหน้าเว็บไซต์</p>}<Link href={`/admin/media/${asset.id}`}>แก้ไขรายละเอียด</Link></div></article>)}</div>}
    {pageCount > 1 && <nav className="admin-media-pagination" aria-label="แบ่งหน้าคลังรูป"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1}>ก่อนหน้า</button><span>หน้า {currentPage} / {pageCount} · {filtered.length} รูป</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage === pageCount}>ถัดไป</button></nav>}
  </section>;
}
