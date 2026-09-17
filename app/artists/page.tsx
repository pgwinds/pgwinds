import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
import { getPublishedCollectionAppearance } from "@/lib/queries/website";
export const metadata = { title: "Artists" };
export default async function ArtistsPage() { const [items, appearance] = await Promise.all([getPublishedListings("artists"), getPublishedCollectionAppearance("artists")]); return <><PageHero label="Artists" title={appearance.content.hero.title} intro={appearance.content.hero.intro} backgroundImageUrl={appearance.heroImageUrl} overlay={appearance.content.hero.overlay} /><ContentList items={items} empty="Artist profiles will appear here soon." /></>; }
