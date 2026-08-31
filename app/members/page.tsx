import { PageHero } from "@/components/shared/page-hero";
import { ContentList } from "@/components/public/content-list";
import { getPublishedListings } from "@/lib/queries/programme";
export const metadata = { title: "Members" };
export default async function MembersPage() { return <><PageHero label="Members" title="The people behind the sound." intro="Meet the current members of PGWINDS." /><ContentList items={await getPublishedListings("members")} empty="Member profiles will appear here soon." /></>; }
