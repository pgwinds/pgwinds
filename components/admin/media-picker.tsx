"use client";

import Image from "next/image";
import { useState } from "react";

type MediaOption = { id: string; altText: string; publicUrl: string };

export function MediaPicker({ name, label, assets, defaultValue, optional = true }: { name: string; label: string; assets: MediaOption[]; defaultValue: string | null; optional?: boolean }) {
  const [selectedId, setSelectedId] = useState(defaultValue ?? "");
  const selected = assets.find((asset) => asset.id === selectedId);
  return <label className="admin-media-picker"><span>{label}</span><select name={name} value={selectedId} onChange={(event) => setSelectedId(event.target.value)} required={!optional}><option value="">{optional ? "No image selected" : "Select an image"}</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.altText}</option>)}</select>{selected && <Image src={selected.publicUrl} alt={selected.altText} width={640} height={360} />}</label>;
}
