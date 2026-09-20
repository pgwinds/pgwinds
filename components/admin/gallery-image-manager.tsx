"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { removeImageFromGallery, saveGalleryImageOrder } from "@/lib/actions/admin";
import type { AdminGalleryImage } from "@/lib/queries/admin-content";

export function GalleryImageManager({ galleryId, initialImages }: { galleryId: string; initialImages: AdminGalleryImage[] }) {
  const [images, setImages] = useState(initialImages);
  const initialOrder = useMemo(() => initialImages.map((image) => image.galleryItemId), [initialImages]);
  const hasChanges = images.some((image, index) => image.galleryItemId !== initialOrder[index]);
  const saveOrderAction = saveGalleryImageOrder.bind(null, galleryId);

  function moveImage(index: number, offset: -1 | 1) {
    const destination = index + offset;
    if (destination < 0 || destination >= images.length) return;
    setImages((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function discardChanges() {
    if (!window.confirm("ยกเลิกการเรียงลำดับที่ยังไม่ได้บันทึกใช่หรือไม่?")) return;
    setImages(initialImages);
  }

  return (
    <>
      <form className="admin-gallery-order-save" action={saveOrderAction}>
        <input type="hidden" name="galleryItemIds" value={JSON.stringify(images.map((image) => image.galleryItemId))} />
        <p>{hasChanges ? "จัดลำดับในหน้านี้แล้ว กดบันทึกลำดับทั้งหมดเมื่อเสร็จ" : "กดขึ้น/ลงเพื่อจัดลำดับ แล้วบันทึกเพียงครั้งเดียว"}</p>
        <div>
          {hasChanges && <button type="button" className="admin-text-button" onClick={discardChanges}>ยกเลิกการจัดลำดับ</button>}
          <FormSubmitButton label="บันทึกลำดับทั้งหมด" pendingLabel="กำลังบันทึกลำดับ…" disabled={!hasChanges} />
        </div>
      </form>

      <div className="admin-gallery-image-grid">
        {images.map((image, index) => {
          const removeAction = removeImageFromGallery.bind(null, galleryId, image.galleryItemId);
          return (
            <article key={image.galleryItemId}>
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
                <form action={removeAction}>
                  <FormSubmitButton className="admin-text-button" label="Remove from gallery" pendingLabel="Removing…" />
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
