"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n/shared";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  const targetLocale: Locale = locale === "en" ? "th" : "en";
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <Link className="language-switcher" href={localizedPath(pathname, targetLocale)} aria-label={locale === "en" ? "Switch to Thai" : "Switch to English"}>{locale === "en" ? "ไทย" : "EN"}</Link>;
}
