import type { CSSProperties } from "react";

type PageHeroProps = { label: string; title: string; intro: string; backgroundImageUrl?: string | null; overlay?: number };
type PageHeroStyle = CSSProperties & Partial<Record<"--page-hero-image" | "--page-hero-overlay", string>>;

export function PageHero({ label, title, intro, backgroundImageUrl, overlay = 40 }: PageHeroProps) {
  const style: PageHeroStyle | undefined = backgroundImageUrl ? { "--page-hero-image": `url("${backgroundImageUrl}")`, "--page-hero-overlay": String(overlay / 100) } : undefined;
  return <section className={`page-hero ${backgroundImageUrl ? "page-hero--custom-image" : ""}`} style={style}><div className="container"><p className="eyebrow">{label}</p><h1>{title}</h1><p>{intro}</p></div></section>;
}
