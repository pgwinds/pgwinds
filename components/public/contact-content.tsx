import { SocialLinks } from "@/components/public/social-links";
import { PageHero } from "@/components/shared/page-hero";
import { pageCopy, type Locale } from "@/lib/i18n";
import type { SocialLink } from "@/lib/queries/website";
import type { ContactContent } from "@/lib/validations/website";

export function ContactContentView({ content, links, locale = "en" }: { content: ContactContent; links: SocialLink[]; locale?: Locale }) {
  const copy = pageCopy(locale).contact;
  return <><PageHero label={copy.label} title={content.hero.title} intro={content.hero.intro} /><section className="section"><div className="container contact-grid">{content.email && <div><p className="eyebrow">{copy.email}</p><a className="contact-link" href={`mailto:${content.email}`}>{content.email}</a></div>}{content.phone && <div><p className="eyebrow">{copy.phone}</p><a className="contact-link" href={`tel:${content.phone.replace(/\s+/g, "")}`}>{content.phone}</a></div>}{content.address && <div><p className="eyebrow">{copy.address}</p><p className="preserve-lines">{content.address}</p></div>}{links.length > 0 && <div><p className="eyebrow">{copy.follow}</p><SocialLinks links={links} /></div>}</div></section></>;
}
