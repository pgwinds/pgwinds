import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublicConcerts } from "@/lib/queries/concerts";
export const metadata = { title: "Concert Archive" };
export default async function ArchivePage() { const concerts = await getPublicConcerts(); return <><PageHero label="Concert archive" title="Music that stays with us." intro="A record of PGWINDS performances across the years." /><ContentList items={concerts.map((concert) => ({ id: concert.id, title: concert.title, summary: concert.description, meta: concert.displayDate }))} empty="Our concert archive will be available soon." /></>; }
