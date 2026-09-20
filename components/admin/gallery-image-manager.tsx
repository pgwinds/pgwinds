"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { saveGalleryImageChanges } from "@/lib/actions/admin";
import type { AdminGalleryImage } from "@/lib/queries/admin-content";

export function GalleryImageManager({ galleryId, initialImages }: { galleryId: string; initialImages: AdminGalleryImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const initialOrder = useMemo(() => initialImages.map((image) => image.galleryItemId), [initialImages]);
  const hasChanges = removedIds.size > 0 || images.some((image, index) => image.galleryItemId !== initialOrder[index]);
  const saveOrderAction = saveGalleryImageChanges.bind(null, galleryId);

  function moveImage(index: number, offset: -1 | 1) {
    const destination = index + offset;
    if (destination < 0 || destination >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function toggleSelected(galleryItemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(galleryItemId)) next.delete(galleryItemId);
      else next.add(galleryItemId);
      return next;
    });
  }

  function canMoveSelected(direction: -1 | 1) {
    return images.some((image, index) => {
      if (!selectedIds.has(image.galleryItemId)) return false;
      const neighbor = images[index + direction];
      return Boolean(neighbor && !selectedIds.has(neighbor.galleryItemId));
    });
  }

  function moveSelected(direction: -1 | 1) {
    if (!canMoveSelected(direction)) return;
    setImages((current) => {
      const next = [...current];
      const start = direction === -1 ? 1 : next.length - 2;
      const end = direction === -1 ? next.length : -1;
      const step = direction === -1 ? 1 : -1;

      for (let index = start; index !== end; index += step) {
        const neighborIndex = index + direction;
        if (selectedIds.has(next[index].galleryItemId) && !selectedIds.has(next[neighborIndex].galleryItemId)) {
          [next[index], next[neighborIndex]] = [next[neighborIndex], next[index]];
        }
      }
      return next;
    });
  }

  function discardChanges() {
    if (!window.confirm("ยกเลิกการจัดลำดับและการนำรูปออกที่ยังไม่ได้บันทึกใช่หรือไม่?")) return;
    setImages(initialImages);
    setRemovedIds(new Set());
    setSelectedIds(new Set());
  }

  function stageRemoval(galleryItemId: string) {
    if (!window.confirm("นำรูปนี้ออกจาก Gallery หรือไม่? รูปจะยังไม่ถูกลบจริงจนกดบันทึกการเปลี่ยนแปลงทั้งหมด")) return;
    setImages((current) => current.filter((image) => image.galleryItemId !== galleryItemId));
    setRemovedIds((current) => new Set([...current, galleryItemId]));
    setSelectedIds((current) => {
      const next = new Set(current);
      next.delete(galleryItemId);
      return next;
    });
  }

  return (
    <>
      <form className="admin-gallery-order-save" action={saveOrderAction}>
        <input type="hidden" name="galleryItemIds" value={JSON.stringify(images.map((image) => image.galleryItemId))} />
        <input type="hidden" name="removedGalleryItemIds" value={JSON.stringify([...removedIds])} />
        <p>{hasChanges ? `มีการเปลี่ยนแปลงแล้ว${removedIds.size > 0 ? ` และนำรูปออก ${removedIds.size} รูป` : ""} กดบันทึกการเปลี่ยนแปลงทั้งหมดเมื่อเสร็จ` : "เลือกหลายรูปเพื่อเลื่อนเป็นกลุ่ม หรือกดขึ้น/ลงรายรูป แล้วบันทึกเพียงครั้งเดียว"}</p>
        <div>
          <span className="admin-gallery-order-save__selection">เลือกแล้ว {selectedIds.size} รูป</span>
          <button
            type="button"
            className="admin-order-button"
            onClick={() => setSelectedIds(new Set(images.map((image) => image.galleryItemId)))}
            disabled={images.length === 0 || selectedIds.size === images.length}
          >
            เลือกทั้งหมด
          </button>
          <button type="button" className="admin-order-button" onClick={() => setSelectedIds(new Set())} disabled={selectedIds.size === 0}>
            ล้างที่เลือก
          </button>
          <button type="button" className="admin-order-button" onClick={() => moveSelected(-1)} disabled={!canMoveSelected(-1)}>
            ↑ เลื่อนกลุ่มขึ้น 1
          </button>
          <button type="button" className="admin-order-button" onClick={() => moveSelected(1)} disabled={!canMoveSelected(1)}>
            ↓ เลื่อนกลุ่มลง 1
          </button>
          {hasChanges && <button type="button" className="admin-text-button" onClick={discardChanges}>ยกเลิกการจัดลำดับ</button>}
          <FormSubmitButton label="บันทึกการเปลี่ยนแปลงทั้งหมด" pendingLabel="กำลังบันทึก…" disabled={!hasChanges} />
        </div>
      </form>

      <div className="admin-gallery-image-grid">
        {images.map((image, index) => {
          return (
            <article key={image.galleryItemId}>
              <label className="admin-gallery-image-select">
                <input
                  type="checkbox"
                  checked={selectedIds.has(image.galleryItemId)}
                  onChange={() => toggleSelected(image.galleryItemId)}
                  aria-label={`เลือกรูป ${image.altText}`}
                />
                เลือก
              </label>
              <Image src={image.publicUrl} alt={image.altText} width={640} height={480} />
              <div>
                <strong>{image.altText}</strong>
                {image.caption && <span>{image.caption}</span>}
                <div className="admin-gallery-image-order">
                  <span>ลำดับ {index + 1} จาก {images.length}</span>
                  <div>
                    <button className="admin-order-button" type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}>↑ ขึ้น</button>
                    <button className="admin-order-button" type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}>↓ ลง</button>
                  </div>
                </div>
                <button className="admin-text-button" type="button" onClick={() => stageRemoval(image.galleryItemId)}>Remove from gallery</button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
