import { AboutContentView } from "@/components/public/about-content";
import { getPublishedAboutContent } from "@/lib/queries/website";

export const metadata = { title: "About" };

export default async function AboutPage() { const { content, heroImageUrl } = await getPublishedAboutContent(); return <AboutContentView content={content} heroImageUrl={heroImageUrl} />; }
