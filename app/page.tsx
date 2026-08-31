import Link from "next/link";
import { SectionHeading } from "@/components/ui/section-heading";
import { pillars } from "@/lib/constants";
import { getFeaturedConcert } from "@/lib/queries/concerts";

export default async function HomePage() {
  const featuredConcert = await getFeaturedConcert();
  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <p className="eyebrow">Prince of Songkla University</p>
          <h1>Where wind, rhythm<br />and community meet.</h1>
          <p className="hero__lead">PGWINDS is a place for musicians to grow, perform, and share the joy of music with the world.</p>
          <div className="button-row"><Link className="button" href="/concerts">Explore concerts</Link><Link className="button button--ghost" href="/about">Meet PGWINDS</Link></div>
        </div>
      </section>
      <section className="section"><div className="container"><SectionHeading label="Our sound" title="Built by people who love to play." /><div className="pillar-grid">{pillars.map((pillar) => <article className="pillar" key={pillar.title}><span>{pillar.number}</span><h3>{pillar.title}</h3><p>{pillar.description}</p></article>)}</div></div></section>
      <section className="section section--accent"><div className="container feature"><div><p className="eyebrow">Coming up</p><h2>{featuredConcert.title}</h2><p className="feature__meta">{featuredConcert.displayDate} · {featuredConcert.venue}</p><p>{featuredConcert.description}</p><Link className="text-link" href="/concerts">View all concerts <span aria-hidden="true">→</span></Link></div><div className="feature__mark" aria-hidden="true">♫</div></div></section>
    </>
  );
}
