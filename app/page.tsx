import { HomeContent } from "@/components/public/home-content";
import Link from "next/link";
import { getPublicConcerts } from "@/lib/queries/concerts";
import { getPublishedHomeContent } from "@/lib/queries/website";

export default async function HomePage() {
  const [{ content, media }, concerts] = await Promise.all([getPublishedHomeContent(), getPublicConcerts()]);
  return <><HomeContent content={content} media={media} concerts={concerts} /><Link className="admin-home-entry" href="/admin" aria-label="Admin sign in" title="Admin"><span aria-hidden="true">A</span></Link></>;
}
