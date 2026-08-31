type PageHeroProps = { label: string; title: string; intro: string };
export function PageHero({ label, title, intro }: PageHeroProps) { return <section className="page-hero"><div className="container"><p className="eyebrow">{label}</p><h1>{title}</h1><p>{intro}</p></div></section>; }
