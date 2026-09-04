import { isExternalContentLink, isSafeContentLink } from "@/lib/content-links";

export function ContentCta({ label, url, className = "button content-cta" }: { label?: string | null; url?: string | null; className?: string }) {
  if (!label || !isSafeContentLink(url)) return null;
  const external = isExternalContentLink(url);
  return <a className={className} href={url} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{label}{external && <span aria-hidden="true"> ↗</span>}</a>;
}
