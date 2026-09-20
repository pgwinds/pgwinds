"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MediaOption = { id: string; altText: string; publicUrl: string; caption?: string; albums?: Array<{ name: string }>; tags?: Array<{ name: string }> };

export function MediaPicker({ name, label, assets, defaultValue, optional = true }: { name: string; label: string; assets: MediaOption[]; defaultValue: string | null; optional?: boolean }) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState("");
  const [tag, setTag] = useState("");
  const selected = assets.find((asset) => asset.id === selectedId);
  const albums = useMemo(() => [...new Set(assets.flatMap((asset) => asset.albums?.map((item) => item.name) ?? []))].sort(), [assets]);
  const tags = useMemo(() => [...new Set(assets.flatMap((asset) => asset.tags?.map((item) => item.name) ?? []))].sort(), [assets]);
  const matching = useMemo(() => assets.filter((asset) => `${asset.altText} ${asset.caption ?? ""} ${(asset.albums ?? []).map((item) => item.name).join(" ")} ${(asset.tags ?? []).map((item) => item.name).join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (!album || asset.albums?.some((item) => item.name === album)) && (!tag || asset.tags?.some((item) => item.name === tag))).slice(0, 24), [album, assets, query, tag]);
  return <div className="admin-media-picker admin-editor__wide"><span>{label}</span><input type="hidden" name={name} value={selectedId} /><div className="admin-media-picker__controls"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหารูปจากชื่อหรือคำบรรยาย" aria-label={`ค้นหา ${label}`} />{optional && selectedId && <button type="button" onClick={() => setSelectedId("")}>ล้างรูปที่เลือก</button>}</div>{(albums.length > 0 || tags.length > 0) && <div className="admin-media-picker__filters">{albums.length > 0 && <select value={album} onChange={(event) => setAlbum(event.target.value)} aria-label="Filter by album"><option value="">ทุก Album</option>{albums.map((item) => <option key={item}>{item}</option>)}</select>}{tags.length > 0 && <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Filter by tag"><option value="">ทุก Tag</option>{tags.map((item) => <option key={item}>{item}</option>)}</select>}</div>}{selected && <p className="admin-media-picker__selected">เลือกแล้ว: <strong>{selected.altText}</strong></p>}<div className="admin-media-picker__grid" role="listbox" aria-label={label}>{matching.map((asset) => <button key={asset.id} type="button" role="option" aria-selected={asset.id === selectedId} className={asset.id === selectedId ? "is-selected" : ""} onClick={() => setSelectedId(asset.id)}><Image src={asset.publicUrl} alt="" width={320} height={200} /><span>{asset.altText}</span></button>)}</div>{matching.length === 0 && <p className="admin-help">ไม่พบรูปที่ตรงกับคำค้นหา</p>}{assets.length > matching.length && <p className="admin-help">แสดงสูงสุด 24 รูป โปรดค้นหาหรือเลือก Album/Tag เพื่อจำกัดรายการ</p>}</div>;
}
