import Image from "next/image";
import Link from "next/link";
import { ContentCta } from "@/components/public/content-cta";
import type { Repertoire } from "@/types/content";

export function RepertoireList({ items, coverUrls, emptyTitle, emptyBody, hrefFor, watchLabel }: { items: Repertoire[]; coverUrls: Record<string, string>; emptyTitle: string; emptyBody: string; hrefFor: (slug: string) => string; watchLabel: string }) {
  if (items.length === 0) return <div className="empty-state"><h2>{emptyTitle}</h2><p>{emptyBody}</p></div>;
  return <div className="concert-list repertoire-list">{items.map((item) => {
    const coverUrl = item.coverMediaId ? coverUrls[item.coverMediaId] : null;
    return <article className={`concert-card repertoire-card${coverUrl ? " repertoire-card--with-cover" : ""}`} key={item.id}>
      {coverUrl && <Link className="repertoire-card__cover" href={hrefFor(item.slug)} aria-label={`View ${item.title}`}><Image src={coverUrl} alt={`Cover image for ${item.title}`} width={960} height={640} sizes="(max-width: 700px) 100vw, 420px" /></Link>}
      <div className="repertoire-card__content"><p className="eyebrow">{[item.composer, item.arranger ? `arr. ${item.arranger}` : ""].filter(Boolean).join(" · ")}</p><h2><Link href={hrefFor(item.slug)}>{item.title}</Link></h2>{item.instrumentation && <p className="concert-card__venue">{item.instrumentation}</p>}{item.notes && <p>{item.notes}</p>}<ContentCta label={item.youtubeUrl ? watchLabel : null} url={item.youtubeUrl} /></div>
    </article>;
  })}</div>;
}
