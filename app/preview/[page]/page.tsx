import { notFound, redirect } from "next/navigation";
import { AboutContentView } from "@/components/public/about-content";
import { ContactContentView } from "@/components/public/contact-content";
import { DraftPreviewBanner } from "@/components/public/draft-preview-banner";
import { HomeContent } from "@/components/public/home-content";
import { getAdminUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n/shared";
import { getPublicConcerts } from "@/lib/queries/concerts";
import { getAdminAboutContent, getAdminContactContent, getAdminHomeContent, getMediaPublicUrls, getPublicSocialLinks } from "@/lib/queries/website";

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

  notFound();
}
