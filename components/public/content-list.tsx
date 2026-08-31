import type { ListingItem } from "@/lib/queries/programme";

export function ContentList({ items, empty }: { items: ListingItem[]; empty: string }) { return <section className="section"><div className="container">{items.length === 0 ? <div className="empty-state"><h2>Coming soon.</h2><p>{empty}</p></div> : <div className="concert-list">{items.map((item) => <article className="concert-card" key={item.id}>{item.meta && <p className="eyebrow">{item.meta}</p>}<h2>{item.title}</h2>{item.summary && <p>{item.summary}</p>}</article>)}</div>}</div></section>; }
