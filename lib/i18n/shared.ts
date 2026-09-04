export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];

export function localeFromPath(pathname: string): Locale { return pathname === "/th" || pathname.startsWith("/th/") ? "th" : "en"; }

export function localizedPath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const cleanPath = path.replace(/^\/(?:en|th)(?=\/|$)/, "") || "/";
  return locale === "th" ? `/th${cleanPath === "/" ? "" : cleanPath}` : cleanPath;
}

const navigationTranslations: Record<string, { en: string; th: string }> = { about: { en: "About", th: "เกี่ยวกับเรา" }, concerts: { en: "Concerts", th: "คอนเสิร์ต" }, contact: { en: "Contact", th: "ติดต่อ" }, gallery: { en: "Gallery", th: "แกลเลอรี" }, artists: { en: "Artists", th: "ศิลปิน" }, repertoire: { en: "Repertoire", th: "บทเพลง" }, news: { en: "News", th: "ข่าวสาร" }, events: { en: "Events", th: "กิจกรรม" } };
export function localizeNavigationLabel(itemKey: string, fallback: string, locale: Locale): string { return navigationTranslations[itemKey]?.[locale] ?? fallback; }
export function moreLabel(locale: Locale): string { return locale === "th" ? "เพิ่มเติม" : "More"; }
