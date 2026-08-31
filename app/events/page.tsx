import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "Events" };
export default async function EventsPage() { return <><PageHero label="Events" title="See you there." intro="Find upcoming PGWINDS events and special appearances." /><ContentList items={await getPublishedListings("events")} empty="Our next events will be announced here." /></>; }
