import { RepertoireList } from "@/components/public/repertoire-list";
import { PageHero } from "@/components/shared/page-hero";
import { getPublicRepertoire, getPublicRepertoireCoverUrls } from "@/lib/queries/repertoire";
import { getPublishedCollectionAppearance } from "@/lib/queries/website";
export const metadata = { title: "Repertoire" };
export default async function RepertoirePage() { const [items, appearance] = await Promise.all([getPublicRepertoire(), getPublishedCollectionAppearance("repertoire")]); const coverUrls = await getPublicRepertoireCoverUrls(items.map((item) => item.coverMediaId)); return <div className="repertoire-page"><PageHero label="Repertoire" title={appearance.content.hero.title} intro={appearance.content.hero.intro} backgroundImageUrl={appearance.heroImageUrl} overlay={appearance.content.hero.overlay} /><section className="section"><div className="container"><RepertoireList items={items} coverUrls={coverUrls} emptyTitle="Coming soon." emptyBody="Our repertoire portfolio will appear here soon." hrefFor={(slug) => `/repertoire/${slug}`} watchLabel="Watch on YouTube" /></div></section></div>; }
