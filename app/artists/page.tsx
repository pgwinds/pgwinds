import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "Artists" };
export default async function ArtistsPage() { return <><PageHero label="Artists" title="Musicians we welcome." intro="Meet the artists who share the stage with PGWINDS." /><ContentList items={await getPublishedListings("artists")} empty="Artist profiles will appear here soon." /></>; }
