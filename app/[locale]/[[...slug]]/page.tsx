import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AboutContentView } from "@/components/public/about-content";
import { ContactContentView } from "@/components/public/contact-content";
import { ContentCta } from "@/components/public/content-cta";
import { ContentList } from "@/components/public/content-list";
import { GalleryContent } from "@/components/public/gallery-content";
import { HomeContent } from "@/components/public/home-content";
import { PageHero } from "@/components/shared/page-hero";
import { getPublicConcerts } from "@/lib/queries/concerts";
import { getPublicGalleries } from "@/lib/queries/galleries";
import { isLocale, localizedPath, pageCopy, type Locale } from "@/lib/i18n";
import { getPublishedListings } from "@/lib/queries/programme";
import { getPublicRepertoire } from "@/lib/queries/repertoire";
import { getPublishedAboutContent, getPublishedContactContent, getPublishedHomeContent, getPublicSocialLinks } from "@/lib/queries/website";

const publicPages = ["concerts", "gallery", "artists", "repertoire", "news", "events", "members", "alumni", "archive"] as const;
type PublicPage = (typeof publicPages)[number];

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const { locale, slug = [] } = await params;
  if (!isLocale(locale)) return {};
  const path = slug.length ? `/${slug.join("/")}` : "/";
  return { alternates: { canonical: localizedPath(path, locale), languages: { en: localizedPath(path, "en"), th: localizedPath(path, "th") } } };
}

export default async function LocalizedPublicPage({ params }: { params: Promise<{ locale: string; slug?: string[] }> }) {
  const { locale: localeValue, slug = [] } = await params;
  if (!isLocale(localeValue)) notFound();
  const locale = localeValue as Locale;
  const section = slug[0] ?? "home";
  if (slug.length > 1) redirect(`/${slug.join("/")}`);

  if (section === "home") {
    const [{ content, media }, concerts] = await Promise.all([getPublishedHomeContent(locale), getPublicConcerts()]);
    return <HomeContent content={content} media={media} concerts={concerts} locale={locale} />;
  }
  if (section === "about") {
    const { content, heroImageUrl } = await getPublishedAboutContent(locale);
    return <AboutContentView content={content} heroImageUrl={heroImageUrl} locale={locale} />;
  }
  if (section === "contact") {
    const [content, links] = await Promise.all([getPublishedContactContent(locale), getPublicSocialLinks()]);
    return <ContactContentView content={content} links={links} locale={locale} />;
  }
  if (!publicPages.includes(section as PublicPage)) notFound();

  const copy = pageCopy(locale);
  const [label, title, intro] = copy.pages[section as PublicPage];

  if (section === "concerts") {
    const concerts = await getPublicConcerts();
    return <><PageHero label={label} title={title} intro={intro} /><section className="section"><div className="container concert-list">{concerts.map((concert) => <article className="concert-card" key={concert.id}><p className="eyebrow">{concert.displayDate}</p><h2>{concert.title}</h2><p>{concert.description}</p><p className="concert-card__venue">{concert.venue}</p><ContentCta label={concert.ctaLabel} url={concert.ctaUrl} /></article>)}</div></section></>;
  }
  if (section === "gallery") {
    const galleries = await getPublicGalleries();
    return <><PageHero label={label} title={title} intro={intro} /><GalleryContent galleries={galleries} emptyTitle={locale === "th" ? "ยังไม่มีแกลเลอรี" : "No galleries yet."} emptyBody={locale === "th" ? "ภาพกิจกรรมจะปรากฏที่นี่เมื่อมีการเผยแพร่" : "New photographic stories will appear here once they are published."} /></>;
  }
  if (section === "repertoire") {
    const items = await getPublicRepertoire();
    return <><PageHero label={label} title={title} intro={intro} /><section className="section"><div className="container">{items.length === 0 ? <div className="empty-state"><h2>{copy.empty.repertoireTitle}</h2><p>{copy.empty.repertoire}</p></div> : <div className="concert-list">{items.map((item) => <article className="concert-card" key={item.id}><p className="eyebrow">{[item.composer, item.arranger ? `arr. ${item.arranger}` : ""].filter(Boolean).join(" · ")}</p><h2><Link href={localizedPath(`/repertoire/${item.slug}`, locale)}>{item.title}</Link></h2>{item.instrumentation && <p className="concert-card__venue">{item.instrumentation}</p>}{item.notes && <p>{item.notes}</p>}<ContentCta label={item.youtubeUrl ? copy.watchYouTube : null} url={item.youtubeUrl} /></article>)}</div>}</div></section></>;
  }
  if (section === "archive") {
    const concerts = await getPublicConcerts();
    return <><PageHero label={label} title={title} intro={intro} /><ContentList items={concerts.map((concert) => ({ id: concert.id, title: concert.title, summary: concert.description, meta: concert.displayDate }))} empty={copy.empty.archive} /></>;
  }

  const programmeSection = section as "artists" | "news" | "events" | "members" | "alumni";
  return <><PageHero label={label} title={title} intro={intro} /><ContentList items={await getPublishedListings(programmeSection)} empty={copy.empty[programmeSection]} /></>;
}
