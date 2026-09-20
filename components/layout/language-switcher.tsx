"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { localeFromPath, localizedPath, type Locale } from "@/lib/i18n/shared";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const locale = localeFromPath(pathname);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  // Admin editors have their own language tabs which preserve the current form.
  // Do not create unsupported /th/admin routes from the public-site switcher.
  if (pathname.startsWith("/admin") || pathname.startsWith("/preview")) return null;
  const targetLocale: Locale = locale === "en" ? "th" : "en";
  return <Link className="language-switcher" href={localizedPath(pathname, targetLocale)} aria-label={locale === "en" ? "Switch to Thai" : "Switch to English"}>{locale === "en" ? "ไทย" : "EN"}</Link>;
}
