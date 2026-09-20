"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import type { NavigationItem } from "@/lib/queries/website";

const maximumMainItems = 3;

type NavigationManagerProps = {
  initialMainItems: NavigationItem[];
  initialMoreItems: NavigationItem[];
  saveLayoutAction: (formData: FormData) => void | Promise<void>;
};

function moveItem(items: NavigationItem[], index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

export function NavigationManager({ initialMainItems, initialMoreItems, saveLayoutAction }: NavigationManagerProps) {
  const [mainItems, setMainItems] = useState(initialMainItems);
  const [moreItems, setMoreItems] = useState(initialMoreItems);
  const initialLayout = useMemo(() => JSON.stringify({ main: initialMainItems.map((item) => item.id), more: initialMoreItems.map((item) => item.id) }), [initialMainItems, initialMoreItems]);
  const hasChanges = JSON.stringify({ main: mainItems.map((item) => item.id), more: moreItems.map((item) => item.id) }) !== initialLayout;

  function promoteFirstMoreItem() {
    const promoted = moreItems[0];
    if (!promoted) return;
    if (mainItems.length < maximumMainItems) {
      setMainItems((current) => [...current, promoted]);
      setMoreItems((current) => current.slice(1));
      return;
    }
    const demoted = mainItems[mainItems.length - 1];
    setMainItems((current) => [...current.slice(0, -1), promoted]);
    setMoreItems((current) => [demoted, ...current.slice(1)]);
  }

  function demoteMainItem(index: number) {
    const demoted = mainItems[index];
    if (!demoted) return;
    setMainItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMoreItems((current) => [demoted, ...current]);
  }

  function discardChanges() {
    if (!window.confirm("ยกเลิกการจัด Navigation ที่ยังไม่ได้บันทึกใช่หรือไม่?")) return;
    setMainItems(initialMainItems);
    setMoreItems(initialMoreItems);
  }

  return (
    <form className="admin-navigation-manager" action={saveLayoutAction}>
      <input type="hidden" name="mainIds" value={JSON.stringify(mainItems.map((item) => item.id))} />
      <input type="hidden" name="moreIds" value={JSON.stringify(moreItems.map((item) => item.id))} />
      <div className="admin-navigation-manager__save">
        <p>{hasChanges ? "Navigation ถูกปรับในหน้านี้แล้ว กดบันทึกเมื่อตรวจสอบเรียบร้อย" : "Main แสดงได้สูงสุด 3 เมนูบนหัวเว็บ; เมนูอื่นอยู่ใน More"}</p>
        <div>
          {hasChanges && <button type="button" className="admin-text-button" onClick={discardChanges}>ยกเลิกการจัด Navigation</button>}
          <FormSubmitButton label="บันทึก Navigation ทั้งหมด" pendingLabel="กำลังบันทึก Navigation…" disabled={!hasChanges} />
        </div>
      </div>

      <NavigationGroup title="Main navigation" description="แสดงบนหัวเว็บได้สูงสุด 3 เมนู" items={mainItems} onMove={(index, direction) => setMainItems((current) => moveItem(current, index, direction))} onDemote={demoteMainItem} />
      <NavigationGroup title="More menu" description="เมนูเสริมที่แสดงใน More; รายการแรกสามารถย้ายขึ้น Main ได้" items={moreItems} onMove={(index, direction) => setMoreItems((current) => moveItem(current, index, direction))} onPromoteFirst={promoteFirstMoreItem} />
    </form>
  );
}

function NavigationGroup({ title, description, items, onMove, onDemote, onPromoteFirst }: {
  title: string;
  description: string;
  items: NavigationItem[];
  onMove: (index: number, direction: -1 | 1) => void;
  onDemote?: (index: number) => void;
  onPromoteFirst?: () => void;
}) {
  return (
    <section className="admin-navigation-manager__group">
      <header><h2>{title}</h2><p>{description}</p></header>
      {items.length === 0 ? <p className="admin-empty-copy">No navigation items in this group.</p> : <div>
        {items.map((item, index) => (
          <article key={item.id}>
            <div><strong>{item.label}</strong><span>{item.href} · key: {item.itemKey}</span></div>
            <div className="admin-record-actions">
              <em>{item.visible ? "Visible" : "Hidden"}</em>
              <span className="admin-content-order__position">ลำดับ {index + 1}</span>
              <button className="admin-order-button" type="button" onClick={() => onMove(index, -1)} disabled={index === 0}>↑ ขึ้น</button>
              <button className="admin-order-button" type="button" onClick={() => onMove(index, 1)} disabled={index === items.length - 1}>↓ ลง</button>
              {onDemote && <button className="admin-order-button" type="button" onClick={() => onDemote(index)}>↓ ไป More</button>}
              {onPromoteFirst && index === 0 && <button className="admin-order-button" type="button" onClick={onPromoteFirst}>↑ ไป Main</button>}
              <Link href={`/admin/website/navigation/${item.id}`}>Edit</Link>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}
