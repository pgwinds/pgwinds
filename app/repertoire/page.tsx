import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "Repertoire" };
export default async function RepertoirePage() { return <><PageHero label="Repertoire" title="The music we bring to life." intro="Explore works from our growing repertoire." /><ContentList items={await getPublishedListings("repertoire")} empty="Our repertoire will be catalogued here soon." /></>; }
