"use client";

import { usePathname } from "next/navigation";
import { isExternalContentLink, isSafeContentLink } from "@/lib/content-links";
import { localeFromPath, localizedPath, localizeNavigationLabel, moreLabel } from "@/lib/i18n/shared";
import type { NavigationItem } from "@/lib/queries/website";

function NavigationLink({ item }: { item: NavigationItem }) {
  const locale = localeFromPath(usePathname());
  if (!isSafeContentLink(item.href)) return null;
  const external = isExternalContentLink(item.href);
  return <a href={external ? item.href : localizedPath(item.href, locale)} {...(external ? { target: "_blank", rel: "noreferrer" } : {})}>{localizeNavigationLabel(item.itemKey, item.label, locale)}</a>;
}

export function NavigationClient({ items }: { items: NavigationItem[] }) {
  const locale = localeFromPath(usePathname());
  const mainItems = items.filter((item) => item.groupName === "main");
  const moreItems = items.filter((item) => item.groupName === "more");
  return <nav aria-label="Main navigation"><ul className="navigation">{mainItems.map((item) => <li key={item.id}><NavigationLink item={item} /></li>)}{moreItems.length > 0 && <li><details className="more-menu"><summary>{moreLabel(locale)}</summary><ul>{moreItems.map((item) => <li key={item.id}><NavigationLink item={item} /></li>)}</ul></details></li>}</ul></nav>;
}
