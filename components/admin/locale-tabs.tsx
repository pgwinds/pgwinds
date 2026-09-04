import Link from "next/link";
import type { Locale } from "@/lib/i18n/shared";

export function LocaleTabs({ href, locale }: { href: string; locale: Locale }) {
  return <nav className="admin-locale-tabs" aria-label="Editing language"><Link className={locale === "en" ? "is-active" : ""} href={`${href}?locale=en`}>English</Link><Link className={locale === "th" ? "is-active" : ""} href={`${href}?locale=th`}>ไทย</Link></nav>;
}
