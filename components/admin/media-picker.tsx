"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type MediaOption = {
  id: string;
  altText: string;
  publicUrl: string;
  caption?: string;
  albums?: Array<{ name: string }>;
  tags?: Array<{ name: string }>;
};

type MediaPickerProps = {
  name: string;
  label: string;
  assets: MediaOption[];
  defaultValue: string | null;
  optional?: boolean;
  /** Allows Gallery editors to attach several media assets in one submission. */
  multiple?: boolean;
  /** Use in Gallery so a large media library is not shown until an album is chosen. */
  requireAlbumSelection?: boolean;
};

export function MediaPicker({
  name,
  label,
  assets,
  defaultValue,
  optional = true,
  multiple = false,
  requireAlbumSelection = false,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultValue ? [defaultValue] : []);
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState("");
  const [tag, setTag] = useState("");

  const selected = assets.filter((asset) => selectedIds.includes(asset.id));
  const albums = useMemo(
    () => [...new Set(assets.flatMap((asset) => asset.albums?.map((item) => item.name) ?? []))].sort(),
    [assets],
  );
  const tags = useMemo(
    () => [...new Set(assets.flatMap((asset) => asset.tags?.map((item) => item.name) ?? []))].sort(),
    [assets],
  );
  const needsAlbumSelection = requireAlbumSelection && albums.length > 0;
  const matching = useMemo(() => {
    if (needsAlbumSelection && !album) return [];

    const normalizedQuery = query.trim().toLocaleLowerCase();
    return assets
      .filter(
        (asset) =>
          `${asset.altText} ${asset.caption ?? ""} ${(asset.albums ?? []).map((item) => item.name).join(" ")} ${(asset.tags ?? []).map((item) => item.name).join(" ")}`
            .toLocaleLowerCase()
            .includes(normalizedQuery) &&
          (!album || asset.albums?.some((item) => item.name === album)) &&
          (!tag || asset.tags?.some((item) => item.name === tag)),
      )
      .slice(0, 24);
  }, [album, assets, needsAlbumSelection, query, tag]);

  function selectAlbum(nextAlbum: string) {
    setAlbum(nextAlbum);
    if (nextAlbum) {
      setSelectedIds((current) => current.filter((id) => assets.find((asset) => asset.id === id)?.albums?.some((item) => item.name === nextAlbum)));
    }
  }

  function toggleSelection(id: string) {
    setSelectedIds((current) => {
      if (!multiple) return [id];
      return current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id];
    });
  }

  return (
    <div className="admin-media-picker admin-editor__wide">
      <span>{label}</span>
      {selectedIds.map((id) => <input key={id} type="hidden" name={name} value={id} />)}

      <div className="admin-media-picker__controls">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="ค้นหารูปจากชื่อหรือคำบรรยาย"
          aria-label={`ค้นหา ${label}`}
        />
        {optional && selectedIds.length > 0 && (
          <button type="button" onClick={() => setSelectedIds([])}>ล้างรูปที่เลือก</button>
        )}
      </div>

      {(albums.length > 0 || tags.length > 0) && (
        <div className="admin-media-picker__filters">
          {albums.length > 0 && (
            <select value={album} onChange={(event) => selectAlbum(event.target.value)} aria-label="Filter by album">
              <option value="">{needsAlbumSelection ? "เลือก Album เพื่อแสดงรูป" : "ทุก Album"}</option>
              {albums.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}
          {tags.length > 0 && (
            <select value={tag} onChange={(event) => setTag(event.target.value)} aria-label="Filter by tag">
              <option value="">ทุก Tag</option>
              {tags.map((item) => <option key={item}>{item}</option>)}
            </select>
          )}
        </div>
      )}

      {selected.length > 0 && (
        <p className="admin-media-picker__selected">
          {multiple ? <>เลือกแล้ว: <strong>{selected.length} รูป</strong></> : <>เลือกแล้ว: <strong>{selected[0].altText}</strong></>}
        </p>
      )}

      {needsAlbumSelection && !album ? (
        <p className="admin-media-picker__empty">เลือก Album ก่อน เพื่อแสดงรูปที่นำเข้า Gallery ได้</p>
      ) : (
        <>
          <div className="admin-media-picker__grid" role="listbox" aria-label={label}>
            {matching.map((asset) => (
              <button
                key={asset.id}
                type="button"
                role="option"
                aria-selected={selectedIds.includes(asset.id)}
                className={selectedIds.includes(asset.id) ? "is-selected" : ""}
                onClick={() => toggleSelection(asset.id)}
              >
                <Image src={asset.publicUrl} alt="" width={320} height={200} />
                <span>{asset.altText}</span>
              </button>
            ))}
          </div>
          {matching.length === 0 && <p className="admin-help">ไม่พบรูปที่ตรงกับคำค้นหา</p>}
          {assets.length > matching.length && (
            <p className="admin-help">แสดงสูงสุด 24 รูป โปรดค้นหาหรือเลือก Album/Tag เพื่อจำกัดรายการ</p>
          )}
        </>
      )}
    </div>
  );
}
