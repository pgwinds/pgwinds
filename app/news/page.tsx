import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "News" };
export default async function NewsPage() { return <><PageHero label="News" title="From PGWINDS." intro="Stories, announcements, and moments from our community." /><ContentList items={await getPublishedListings("news")} empty="New stories will appear here soon." /></>; }
