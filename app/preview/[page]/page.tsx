import { notFound, redirect } from "next/navigation";
import { AboutContentView } from "@/components/public/about-content";
import { ContactContentView } from "@/components/public/contact-content";
import { DraftPreviewBanner } from "@/components/public/draft-preview-banner";
import { HomeContent } from "@/components/public/home-content";
import { ContentList } from "@/components/public/content-list";
import { GalleryContent } from "@/components/public/gallery-content";
import { RepertoireList } from "@/components/public/repertoire-list";
import { PageHero } from "@/components/shared/page-hero";
import { getAdminUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/shared";
import { getPublicConcerts } from "@/lib/queries/concerts";
import { getPublicGalleries } from "@/lib/queries/galleries";
import { getPublishedListings } from "@/lib/queries/programme";
import { getPublicRepertoire, getPublicRepertoireCoverUrls } from "@/lib/queries/repertoire";
import { collectionAppearancePages, getAdminAboutContent, getAdminCollectionAppearance, getAdminContactContent, getAdminHomeContent, getMediaPublicUrls, getPublicSocialLinks, type CollectionAppearancePage } from "@/lib/queries/website";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function DraftPreviewPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ locale?: string }> }) {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  const { page } = await params;
  const locale: Locale = (await searchParams).locale === "th" ? "th" : "en";

  if (page === "home") {
    const [{ draft }, concerts] = await Promise.all([getAdminHomeContent(locale), getPublicConcerts()]);
    const urls = await getMediaPublicUrls([draft.hero.desktopMediaId, draft.hero.mobileMediaId, draft.featured.backgroundMediaId].filter((id): id is string => Boolean(id)));
    const media = { desktop: draft.hero.desktopMediaId ? urls[draft.hero.desktopMediaId] ?? null : null, mobile: draft.hero.mobileMediaId ? urls[draft.hero.mobileMediaId] ?? null : null, featured: draft.featured.backgroundMediaId ? urls[draft.featured.backgroundMediaId] ?? null : null };
    return <><DraftPreviewBanner page={`Home (${locale.toUpperCase()})`} editorHref={`/admin/website/home?locale=${locale}`} /><HomeContent content={draft} media={media} concerts={concerts} locale={locale} /></>;
  }

  if (page === "about") {
    const { draft } = await getAdminAboutContent(locale);
    const urls = await getMediaPublicUrls(draft.hero.mediaId ? [draft.hero.mediaId] : []);
    return <><DraftPreviewBanner page={`About (${locale.toUpperCase()})`} editorHref={`/admin/website/about?locale=${locale}`} /><AboutContentView content={draft} heroImageUrl={draft.hero.mediaId ? urls[draft.hero.mediaId] ?? null : null} locale={locale} /></>;
  }

  if (page === "contact") {
    const [{ draft }, links] = await Promise.all([getAdminContactContent(locale), getPublicSocialLinks()]);
    return <><DraftPreviewBanner page={`Contact (${locale.toUpperCase()})`} editorHref={`/admin/website/contact?locale=${locale}`} /><ContactContentView content={draft} links={links} locale={locale} /></>;
  }

  if (collectionAppearancePages.includes(page as CollectionAppearancePage)) {
    const pageKey = page as CollectionAppearancePage;
    const { draft } = await getAdminCollectionAppearance(pageKey, locale);
    const urls = await getMediaPublicUrls(draft.hero.mediaId ? [draft.hero.mediaId] : []);
    const heroImageUrl = draft.hero.mediaId ? urls[draft.hero.mediaId] ?? null : null;
    const label = pageKey === "gallery" ? "Gallery" : pageKey === "artists" ? "Artists" : "Repertoire";
    const editorHref = `/admin/website/appearance/${pageKey}?locale=${locale}`;
    if (pageKey === "gallery") {
      const galleries = await getPublicGalleries();
      return <><DraftPreviewBanner page={`${label} (${locale.toUpperCase()})`} editorHref={editorHref} /><PageHero label={label} title={draft.hero.title} intro={draft.hero.intro} backgroundImageUrl={heroImageUrl} overlay={draft.hero.overlay} /><GalleryContent galleries={galleries} emptyTitle="No galleries yet." emptyBody="New photographic stories will appear here once they are published." /></>;
    }
    if (pageKey === "artists") {
      const items = await getPublishedListings("artists");
      return <><DraftPreviewBanner page={`${label} (${locale.toUpperCase()})`} editorHref={editorHref} /><PageHero label={label} title={draft.hero.title} intro={draft.hero.intro} backgroundImageUrl={heroImageUrl} overlay={draft.hero.overlay} /><ContentList items={items} empty="Artist profiles will appear here soon." /></>;
    }
    const items = await getPublicRepertoire();
    const coverUrls = await getPublicRepertoireCoverUrls(items.map((item) => item.coverMediaId));
    return <><DraftPreviewBanner page={`${label} (${locale.toUpperCase()})`} editorHref={editorHref} /><PageHero label={label} title={draft.hero.title} intro={draft.hero.intro} backgroundImageUrl={heroImageUrl} overlay={draft.hero.overlay} /><section className="section"><div className="container"><RepertoireList items={items} coverUrls={coverUrls} emptyTitle="Coming soon." emptyBody="Our repertoire portfolio will appear here soon." hrefFor={(slug) => `/repertoire/${slug}`} watchLabel="Watch on YouTube" /></div></section></>;
  }

  notFound();
}
