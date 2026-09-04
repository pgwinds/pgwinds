import { notFound } from "next/navigation";
import { ContentCta } from "@/components/public/content-cta";
import { PageHero } from "@/components/shared/page-hero";
import { getPublicRepertoireCoverUrl, getPublicRepertoireItem } from "@/lib/queries/repertoire";

export default async function RepertoireDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = await getPublicRepertoireItem(slug);
  if (!item) notFound();
  const coverUrl = await getPublicRepertoireCoverUrl(item.coverMediaId);
  return <><PageHero label="Repertoire" title={item.title} intro={[item.composer, item.arranger ? `Arranged by ${item.arranger}` : ""].filter(Boolean).join(" · ")} backgroundImageUrl={coverUrl} overlay={55} /><section className="section"><div className="container prose repertoire-detail">{item.instrumentation && <><p className="eyebrow">Instrumentation</p><p>{item.instrumentation}</p></>}{item.notes && <><h2>About this work</h2><p>{item.notes}</p></>}<ContentCta label={item.youtubeUrl ? "Watch on YouTube" : null} url={item.youtubeUrl} /></div></section></>;
}
