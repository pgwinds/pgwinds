import { headers } from "next/headers";
import type { AboutContent, ContactContent, HomeContent } from "@/lib/validations/website";

export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined | null): value is Locale { return value === "en" || value === "th"; }
export async function getLocale(): Promise<Locale> { const locale = (await headers()).get("x-pgwinds-locale"); return isLocale(locale) ? locale : "en"; }

export function localizedPath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const cleanPath = path.replace(/^\/(?:en|th)(?=\/|$)/, "") || "/";
  return locale === "th" ? `/th${cleanPath === "/" ? "" : cleanPath}` : cleanPath;
}

export function pageCopy(locale: Locale) {
  if (locale === "th") return {
    more: "เพิ่มเติม", backToAdmin: "กลับไปยังแอดมิน", language: "EN", languageLabel: "เปลี่ยนเป็นภาษาอังกฤษ",
    home: { soundLabel: "เสียงดนตรีของเรา", soundTitle: "สร้างสรรค์จากผู้คนที่รักการบรรเลง", featuredFallback: "คอนเสิร์ตแนะนำ", featuredDescription: "รายละเอียดคอนเสิร์ตจะประกาศเร็ว ๆ นี้", comingUp: "เร็ว ๆ นี้" },
    about: { label: "เกี่ยวกับ PGWINDS", title: "มากกว่าวงดนตรี", intro: "เราคือชุมชนที่เชื่อมโยงกันด้วยพลังของดนตรี", history: "เรื่องราวของเรา", purpose: "เป้าหมายของเรา", institute: "สถาบันของเรา" },
    contact: { label: "ติดต่อ", title: "มาสร้างสรรค์ดนตรีไปด้วยกัน", intro: "สำหรับการเชิญแสดง ความร่วมมือ และการสอบถาม ติดต่อเราได้เสมอ", email: "อีเมล", phone: "โทรศัพท์", address: "ที่ตั้ง", follow: "ติดตามเรา" },
    pages: { concerts: ["คอนเสิร์ต", "ดนตรีสดที่แบ่งปันร่วมกัน", "พบกับการแสดงที่เชื่อมชุมชนของเราเข้าด้วยกัน"], gallery: ["แกลเลอรี", "ช่วงเวลาในเสียงดนตรี", "ภาพของผู้คน การซ้อม และการแสดงเบื้องหลัง PGWINDS"], artists: ["ศิลปิน", "นักดนตรีที่เรายินดีต้อนรับ", "พบกับศิลปินผู้ร่วมแบ่งปันเวทีกับ PGWINDS"], repertoire: ["บทเพลง", "ดนตรีที่เราเก็บไว้กับตัว", "สำรวจบทเพลงที่หล่อหลอมเสียงของ PGWINDS และย้อนชมการแสดงที่คัดสรร"], news: ["ข่าวสาร", "จาก PGWINDS", "เรื่องราว ประกาศ และช่วงเวลาจากชุมชนของเรา"], events: ["กิจกรรม", "พบกันที่นั่น", "ค้นหากิจกรรมและการปรากฏตัวพิเศษของ PGWINDS"], members: ["สมาชิก", "ผู้คนเบื้องหลังเสียงดนตรี", "พบกับสมาชิกปัจจุบันของ PGWINDS"], alumni: ["ศิษย์เก่า", "วงดนตรีที่ยังคงอยู่", "เฉลิมฉลองนักดนตรีที่ยังคงสานต่อเรื่องราวของเรา"], archive: ["คลังคอนเสิร์ต", "ดนตรีที่อยู่กับเรา", "บันทึกการแสดงของ PGWINDS ตลอดหลายปี"] },
    empty: { artists: "ข้อมูลศิลปินจะปรากฏที่นี่เร็ว ๆ นี้", news: "เรื่องราวใหม่จะปรากฏที่นี่เร็ว ๆ นี้", events: "กิจกรรมครั้งต่อไปจะประกาศที่นี่", members: "ข้อมูลสมาชิกจะปรากฏที่นี่เร็ว ๆ นี้", alumni: "ข้อมูลศิษย์เก่าจะปรากฏที่นี่เร็ว ๆ นี้", archive: "คลังคอนเสิร์ตจะพร้อมใช้งานเร็ว ๆ นี้", repertoireTitle: "เร็ว ๆ นี้", repertoire: "พอร์ตโฟลิโอบทเพลงของเราจะปรากฏที่นี่เร็ว ๆ นี้" },
    galleryTiles: ["บนเวที", "ระหว่างการซ้อม", "ร่วมกัน", "เบื้องหลัง", "ในการเคลื่อนไหว", "ในความกลมกลืน"], watchYouTube: "รับชมบน YouTube",
  };
  return {
    more: "More", backToAdmin: "Back to Admin", language: "ไทย", languageLabel: "Switch to Thai",
    home: { soundLabel: "Our sound", soundTitle: "Built by people who love to play.", featuredFallback: "Featured concert", featuredDescription: "Concert details will be announced soon.", comingUp: "Coming up" },
    about: { label: "About PGWINDS", title: "More than an orchestra.", intro: "We are a community brought together by a shared belief in the power of music.", history: "Our story", purpose: "Our purpose", institute: "Our institute" },
    contact: { label: "Contact", title: "Let’s make music happen.", intro: "For performance invitations, collaborations, and general enquiries, get in touch.", email: "Email", phone: "Phone", address: "Based in", follow: "Follow along" },
    pages: { concerts: ["Concerts", "Music, live and shared.", "Discover the performances that bring our community together."], gallery: ["Gallery", "Moments in music.", "A glimpse of the people, practice, and performances behind PGWINDS."], artists: ["Artists", "Musicians we welcome.", "Meet the artists who share the stage with PGWINDS."], repertoire: ["Repertoire", "Music we carry with us.", "Explore the pieces that shape the PGWINDS sound and revisit selected performances."], news: ["News", "From PGWINDS.", "Stories, announcements, and moments from our community."], events: ["Events", "See you there.", "Find upcoming PGWINDS events and special appearances."], members: ["Members", "The people behind the sound.", "Meet the current members of PGWINDS."], alumni: ["Alumni", "A lasting ensemble.", "Celebrating the musicians who continue our story."], archive: ["Concert archive", "Music that stays with us.", "A record of PGWINDS performances across the years."] },
    empty: { artists: "Artist profiles will appear here soon.", news: "New stories will appear here soon.", events: "Our next events will be announced here.", members: "Member profiles will appear here soon.", alumni: "Alumni profiles will appear here soon.", archive: "Our concert archive will be available soon.", repertoireTitle: "Coming soon.", repertoire: "Our repertoire portfolio will appear here soon." },
    galleryTiles: ["On stage", "In rehearsal", "Together", "Behind the scenes", "In motion", "In harmony"], watchYouTube: "Watch on YouTube",
  };
}

export function localizeHomeContent(content: HomeContent, locale: Locale): HomeContent {
  if (locale === "en") return content;
  return { ...content, hero: { ...content.hero, eyebrow: "สถาบันดนตรีกัลยาณิวัฒนา", title: "ที่ซึ่งเสียงลม จังหวะ และชุมชนมาพบกัน", description: "PGWINDS คือวง Princess Galyani Vadhana Institute of Music Wind Symphony พื้นที่สำหรับนักดนตรีได้เติบโต แสดง และแบ่งปันความสุขของดนตรีกับทุกคน", primaryLabel: "ดูคอนเสิร์ต", secondaryLabel: "รู้จัก PGWINDS" }, featured: { ...content.featured, eyebrow: "กำลังจะมาถึง", ctaLabel: content.featured.ctaUrl ? "ดูเพิ่มเติม" : null } };
}

export function localizeAboutContent(content: AboutContent, locale: Locale): AboutContent {
  if (locale === "en") return content;
  return { ...content, hero: { ...content.hero, title: "มากกว่าวงดนตรี", intro: "เราคือชุมชนที่เชื่อมโยงกันด้วยความเชื่อร่วมกันในพลังของดนตรี" }, history: { ...content.history, heading: "เรื่องราวของเรา", body: "PGWINDS คือ Princess Galyani Vadhana Institute of Music Wind Symphony วงวินด์ซิมโฟนีของสถาบันดนตรีกัลยาณิวัฒนา เราสร้างโอกาสให้นักดนตรีได้เรียนรู้ แสดง และเชื่อมโยงผ่านดนตรี" }, philosophy: { ...content.philosophy, heading: "เป้าหมายของเรา", body: "ตั้งแต่ห้องซ้อมจนถึงเวทีคอนเสิร์ต เราหล่อเลี้ยงทักษะทางดนตรี ความเอื้อเฟื้อ และความรู้สึกเป็นส่วนหนึ่งที่ยั่งยืน" }, institute: { ...content.institute, heading: "สถาบันของเรา", body: "สถาบันดนตรีกัลยาณิวัฒนา คือพื้นที่แห่งการเรียนรู้ทางศิลปะ ความร่วมมือ และการค้นพบทางดนตรี" } };
}

export function localizeContactContent(content: ContactContent, locale: Locale): ContactContent {
  if (locale === "en") return content;
  return { ...content, hero: { title: "มาสร้างสรรค์ดนตรีไปด้วยกัน", intro: "สำหรับการเชิญแสดง ความร่วมมือ และการสอบถาม ติดต่อเราได้เสมอ" } };
}

const navigationTranslations: Record<string, { en: string; th: string }> = { about: { en: "About", th: "เกี่ยวกับเรา" }, concerts: { en: "Concerts", th: "คอนเสิร์ต" }, contact: { en: "Contact", th: "ติดต่อ" }, gallery: { en: "Gallery", th: "แกลเลอรี" }, artists: { en: "Artists", th: "ศิลปิน" }, repertoire: { en: "Repertoire", th: "บทเพลง" }, news: { en: "News", th: "ข่าวสาร" }, events: { en: "Events", th: "กิจกรรม" } };
export function localizeNavigationLabel(itemKey: string, fallback: string, locale: Locale): string { return navigationTranslations[itemKey]?.[locale] ?? fallback; }
