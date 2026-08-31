import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "Alumni" };
export default async function AlumniPage() { return <><PageHero label="Alumni" title="A lasting ensemble." intro="Celebrating the musicians who continue our story." /><ContentList items={await getPublishedListings("alumni")} empty="Alumni profiles will appear here soon." /></>; }
