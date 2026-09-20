"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MediaOption = { id: string; altText: string; publicUrl: string; caption?: string };

export function MediaPicker({ name, label, assets, defaultValue, optional = true }: { name: string; label: string; assets: MediaOption[]; defaultValue: string | null; optional?: boolean }) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const [query, setQuery] = useState("");
  const selected = assets.find((asset) => asset.id === selectedId);
  const matching = useMemo(() => assets.filter((asset) => `${asset.altText} ${asset.caption ?? ""}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0, 24), [assets, query]);
  return <div className="admin-media-picker"><span>{label}</span><input type="hidden" name={name} value={selectedId} /><div className="admin-media-picker__controls"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหารูปจากชื่อหรือคำบรรยาย" aria-label={`ค้นหา ${label}`} />{optional && selectedId && <button type="button" onClick={() => setSelectedId("")}>ล้างรูปที่เลือก</button>}</div>{selected && <p className="admin-media-picker__selected">เลือกแล้ว: <strong>{selected.altText}</strong></p>}<div className="admin-media-picker__grid" role="listbox" aria-label={label}>{matching.map((asset) => <button key={asset.id} type="button" role="option" aria-selected={asset.id === selectedId} className={asset.id === selectedId ? "is-selected" : ""} onClick={() => setSelectedId(asset.id)}><Image src={asset.publicUrl} alt="" width={320} height={200} /><span>{asset.altText}</span></button>)}</div>{matching.length === 0 && <p className="admin-help">ไม่พบรูปที่ตรงกับคำค้นหา</p>}{assets.length > matching.length && <p className="admin-help">แสดงสูงสุด 24 รูป โปรดค้นหาด้วยชื่อหรือคำบรรยายเพื่อจำกัดรายการ</p>}</div>;
}
