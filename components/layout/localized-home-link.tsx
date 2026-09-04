"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath } from "@/lib/i18n/shared";

export function LocalizedHomeLink({ children, className, ariaLabel }: { children: ReactNode; className: string; ariaLabel: string }) {
  const locale = localeFromPath(usePathname());
  return <Link className={className} href={localizedPath("/", locale)} aria-label={ariaLabel}>{children}</Link>;
}
