import { PageHero } from "@/components/shared/page-hero";
import { pageCopy, type Locale } from "@/lib/i18n";
import type { AboutContent } from "@/lib/validations/website";

export function AboutContentView({ content, heroImageUrl, locale = "en" }: { content: AboutContent; heroImageUrl: string | null; locale?: Locale }) {
  return <><PageHero label={pageCopy(locale).about.label} title={content.hero.title} intro={content.hero.intro} backgroundImageUrl={heroImageUrl} overlay={content.hero.overlay} /><section className="section"><div className="container prose about-grid"><div><h2>{content.history.heading}</h2><p>{content.history.body}</p></div><div><h2>{content.philosophy.heading}</h2><p>{content.philosophy.body}</p></div><div><h2>{content.institute.heading}</h2><p>{content.institute.body}</p></div></div></section></>;
}
