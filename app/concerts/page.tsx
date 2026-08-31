import { PageHero } from "@/components/shared/page-hero";
import { getPublicConcerts } from "@/lib/queries/concerts";

export const metadata = { title: "Concerts" };

export default async function ConcertsPage() { const concerts = await getPublicConcerts(); return <><PageHero label="Concerts" title="Music, live and shared." intro="Discover the performances that bring our community together." /><section className="section"><div className="container concert-list">{concerts.map((concert) => <article className="concert-card" key={concert.id}><p className="eyebrow">{concert.displayDate}</p><h2>{concert.title}</h2><p>{concert.description}</p><p className="concert-card__venue">{concert.venue}</p></article>)}</div></section></> }
