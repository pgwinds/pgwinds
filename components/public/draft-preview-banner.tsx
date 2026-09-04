import Link from "next/link";

export function DraftPreviewBanner({ page, editorHref }: { page: string; editorHref: string }) {
  return <aside className="draft-preview-banner"><div className="container"><strong>Draft preview: {page}</strong><span>Only signed-in PGWINDS administrators can see this page.</span><Link href={editorHref}>Back to editor</Link></div></aside>;
}
