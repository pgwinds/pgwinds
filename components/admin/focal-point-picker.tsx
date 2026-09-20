"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";

type Point = { x: number; y: number };

function clamp(value: number) {
  return Math.round(Math.min(100, Math.max(0, value)));
}

export function FocalPointPicker({ imageUrl, alt, initialX, initialY }: { imageUrl: string; alt: string; initialX: number; initialY: number }) {
  const [point, setPoint] = useState<Point>({ x: initialX, y: initialY });
  const [dragging, setDragging] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const setFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = previewRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setPoint({ x: clamp(((event.clientX - bounds.left) / bounds.width) * 100), y: clamp(((event.clientY - bounds.top) / bounds.height) * 100) });
  };

  return <div className="admin-focal-picker"><input name="focalX" type="hidden" value={point.x} /><input name="focalY" type="hidden" value={point.y} /><p className="admin-focal-picker__instruction">คลิกหรือกดลากบนภาพ เพื่อวางจุดสำคัญที่ต้องการให้คงอยู่ใน Cover</p><div className="admin-focal-picker__preview" ref={previewRef} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setDragging(true); setFromPointer(event); }} onPointerMove={(event) => { if (dragging) setFromPointer(event); }} onPointerUp={(event) => { setDragging(false); event.currentTarget.releasePointerCapture(event.pointerId); }} role="group" aria-label="เลือกจุดโฟกัสของภาพ"><Image src={imageUrl} alt={alt} width={1200} height={900} priority style={{ objectPosition: `${point.x}% ${point.y}%` }} /><span className="admin-focal-picker__target" aria-hidden="true" style={{ left: `${point.x}%`, top: `${point.y}%` }} /></div><p className="admin-help">ตำแหน่งปัจจุบัน: {point.x}% จากซ้าย · {point.y}% จากบน — ตัวอย่างนี้ใช้การ crop แบบเดียวกับ Repertoire Cover</p></div>;
}
