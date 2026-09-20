"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";

export type OrderableContentRecord = {
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
  actionLabel?: string;
};

type ContentOrderManagerProps = {
  heading: string;
  emptyMessage: string;
  items: OrderableContentRecord[];
  saveOrderAction: (formData: FormData) => void | Promise<void>;
};

export function ContentOrderManager({ heading, emptyMessage, items, saveOrderAction }: ContentOrderManagerProps) {
  const [orderedItems, setOrderedItems] = useState(items);
  const initialOrder = useMemo(() => items.map((item) => item.id), [items]);
  const hasChanges = orderedItems.some((item, index) => item.id !== initialOrder[index]);

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= orderedItems.length) return;
    setOrderedItems((current) => {
      const next = [...current];
      [next[index], next[destination]] = [next[destination], next[index]];
      return next;
    });
  }

  function discard() {
    if (!window.confirm("ยกเลิกการจัดลำดับที่ยังไม่ได้บันทึกใช่หรือไม่?")) return;
    setOrderedItems(items);
  }

  return (
    <section className="admin-records admin-content-order">
      <h2>{heading}</h2>
      {orderedItems.length === 0 ? <p>{emptyMessage}</p> : (
        <form action={saveOrderAction}>
          <input type="hidden" name="contentIds" value={JSON.stringify(orderedItems.map((item) => item.id))} />
          <div className="admin-content-order__save">
            <p>{hasChanges ? "ลำดับถูกปรับในหน้านี้แล้ว กดบันทึกเมื่อตรวจสอบเรียบร้อย" : "ใช้ปุ่มขึ้น/ลงเพื่อจัดลำดับที่แสดงบนเว็บไซต์ แล้วบันทึกเพียงครั้งเดียว"}</p>
            <div>
              {hasChanges && <button type="button" className="admin-text-button" onClick={discard}>ยกเลิกการจัดลำดับ</button>}
              <FormSubmitButton label="บันทึกลำดับทั้งหมด" pendingLabel="กำลังบันทึกลำดับ…" disabled={!hasChanges} />
            </div>
          </div>
          <div>
            {orderedItems.map((item, index) => (
              <article key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  {item.subtitle && <span>{item.subtitle}</span>}
                </div>
                <div className="admin-record-actions">
                  {item.status && <em>{item.status}</em>}
                  <span className="admin-content-order__position">ลำดับ {index + 1}</span>
                  <button className="admin-order-button" type="button" onClick={() => move(index, -1)} disabled={index === 0}>↑ ขึ้น</button>
                  <button className="admin-order-button" type="button" onClick={() => move(index, 1)} disabled={index === orderedItems.length - 1}>↓ ลง</button>
                  <Link href={item.href}>{item.actionLabel ?? "Edit"}</Link>
                </div>
              </article>
            ))}
          </div>
        </form>
      )}
    </section>
  );
}
