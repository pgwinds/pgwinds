import type { SocialLink } from "@/lib/queries/website";

export function SocialLinks({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return <nav className="social-links" aria-label="Social links">{links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noreferrer">{link.label || link.platform}<span aria-hidden="true"> ↗</span></a>)}</nav>;
}
