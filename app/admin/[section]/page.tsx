import { notFound } from "next/navigation";
import { createProgrammeItem } from "@/lib/actions/admin";

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
  return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>{content.title}</h1><p>{content.intro}</p></header><form className="admin-editor" action={createProgrammeItem}><input name="contentType" type="hidden" value={section} /><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="created-from-title-if-empty" pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>{content.meta}<input name="meta" /></label>{section === "events" && <label>Starts at<input name="dateTime" type="datetime-local" /></label>}<label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Description<textarea name="summary" rows={5} /></label><button className="button" type="submit">Create {content.title.slice(0, -1) || content.title}</button></form></>;
}
