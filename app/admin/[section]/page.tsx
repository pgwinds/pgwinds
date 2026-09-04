import { notFound } from "next/navigation";
import Link from "next/link";
import { createProgrammeItem } from "@/lib/actions/admin";
import { getAdminProgrammeListings } from "@/lib/queries/programme";

const sections = {
  news: { title: "News", intro: "Publish announcements and stories.", meta: "Date label or source" },
  events: { title: "Events", intro: "Share upcoming events and appearances.", meta: "Venue" },
  artists: { title: "Artists", intro: "Create profiles for visiting artists.", meta: "Role or instrument" },
  repertoire: { title: "Repertoire", intro: "Catalogue music in the PGWINDS library.", meta: "Composer" },
  members: { title: "Members", intro: "Maintain current member profiles.", meta: "Instrument" },
  alumni: { title: "Alumni", intro: "Celebrate the people who shaped PGWINDS.", meta: "Instrument" },
} as const;

export default async function ProgrammeAdminPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!(section in sections)) notFound();
  const content = sections[section as keyof typeof sections];
  const items = await getAdminProgrammeListings(section as keyof typeof sections);
  const supportsCta = section === "news" || section === "events" || section === "artists";
  return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>{content.title}</h1><p>{content.intro}</p></header><form className="admin-editor" action={createProgrammeItem}><input name="contentType" type="hidden" value={section} /><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="created-from-title-if-empty" pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>{content.meta}<input name="meta" /></label>{section === "events" && <label>Starts at<input name="dateTime" type="datetime-local" /></label>}<label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>{supportsCta && <><label>Button text (optional)<input name="ctaLabel" placeholder="Learn more" /></label><label>Button link (optional)<input name="ctaUrl" placeholder="/contact or https://example.com" /></label><p className="admin-editor__wide admin-help">If you enter only a link, the button will be named “Learn more”.</p></>}<label className="admin-editor__wide">Description<textarea name="summary" rows={5} /></label><button className="button" type="submit">Create {content.title.slice(0, -1) || content.title}</button></form><section className="admin-records"><h2>Existing {content.title}</h2>{items.length === 0 ? <p>No records yet.</p> : <div>{items.map((item) => <article key={item.id}><div><strong>{item.title}</strong>{item.meta && <span>{item.meta}</span>}</div><div className="admin-record-actions"><em>{item.status}</em><Link href={`/admin/${section}/${item.id}`}>Edit</Link></div></article>)}</div>}</section></>;
}
