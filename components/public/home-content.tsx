import type { CSSProperties } from "react";
import { ContentCta } from "@/components/public/content-cta";
import { SectionHeading } from "@/components/ui/section-heading";
import { pillars } from "@/lib/constants";
import { localizedPath, pageCopy, type Locale } from "@/lib/i18n";
import type { HomeMediaUrls } from "@/lib/queries/website";
import type { HomeContent } from "@/lib/validations/website";
import type { Concert } from "@/types/content";

type BackgroundStyle = CSSProperties & Partial<Record<"--hero-desktop-image" | "--hero-mobile-image" | "--hero-overlay" | "--featured-background-image", string>>;

export function HomeContent({ content, media, concerts, locale = "en" }: { content: HomeContent; media: HomeMediaUrls; concerts: Concert[]; locale?: Locale }) {
  const copy = pageCopy(locale).home;
  const featuredConcert = (content.featured.concertId && concerts.find((concert) => concert.id === content.featured.concertId)) || concerts[0];
  const heroStyle: BackgroundStyle | undefined = media.desktop ? { "--hero-desktop-image": `url("${media.desktop}")`, "--hero-mobile-image": `url("${media.mobile ?? media.desktop}")`, "--hero-overlay": String(content.hero.overlay / 100) } : undefined;
  const featuredStyle: BackgroundStyle | undefined = media.featured ? { "--featured-background-image": `url("${media.featured}")` } : undefined;
  const featuredTitle = content.featured.heading || featuredConcert?.title || copy.featuredFallback;
  const featuredDescription = content.featured.description || featuredConcert?.description || copy.featuredDescription;

  return <>{content.hero.visible && <section className={`hero ${media.desktop ? "hero--custom-image" : ""}`} style={heroStyle}><div className={`container hero__inner hero__inner--${content.hero.alignment}`}><p className="eyebrow">{content.hero.eyebrow}</p><h1>{content.hero.title}</h1><p className="hero__lead">{content.hero.description}</p><div className="button-row"><ContentCta label={content.hero.primaryLabel} url={content.hero.primaryUrl ? localizedPath(content.hero.primaryUrl, locale) : null} className="button" /><ContentCta label={content.hero.secondaryLabel} url={content.hero.secondaryUrl ? localizedPath(content.hero.secondaryUrl, locale) : null} className="button button--ghost" /></div></div></section>}<section className="section"><div className="container"><SectionHeading label={copy.soundLabel} title={copy.soundTitle} /><div className="pillar-grid">{pillars.map((pillar) => <article className="pillar" key={pillar.title}><span>{pillar.number}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div></div></section>{content.featured.visible && <section className={`section section--accent home-feature ${media.featured ? "home-feature--custom-image" : ""}`} style={featuredStyle}><div className="container feature"><div><p className="eyebrow">{content.featured.eyebrow || copy.comingUp}</p><h2>{featuredTitle}</h2>{featuredConcert && <p className="feature__meta">{featuredConcert.displayDate} · {featuredConcert.venue}</p>}<p>{featuredDescription}</p><ContentCta label={content.featured.ctaLabel} url={content.featured.ctaUrl ? localizedPath(content.featured.ctaUrl, locale) : null} className="text-link content-cta" /></div><div className="feature__mark" aria-hidden="true">♫</div></div></section>}</>;
}
