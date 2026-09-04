import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProgrammeItem, updateProgrammeItem } from "@/lib/actions/admin";
import { getAdminProgrammeItem, programmeSections, type ProgrammeSection } from "@/lib/queries/programme";

const sectionTitles: Record<ProgrammeSection, string> = { news: "News", events: "Events", artists: "Artists", repertoire: "Repertoire", members: "Members", alumni: "Alumni" };

export default async function EditProgrammeItemPage({ params }: { params: Promise<{ section: string; id: string }> }) {
  const { section, id } = await params;
  if (!programmeSections.includes(section as ProgrammeSection)) notFound();
  const contentType = section as ProgrammeSection;
  const item = await getAdminProgrammeItem(contentType, id);
  if (!item) notFound();
  const updateAction = updateProgrammeItem.bind(null, contentType, item.id);
  const deleteAction = deleteProgrammeItem.bind(null, contentType, item.id);
  const supportsSlug = contentType === "news" || contentType === "events" || contentType === "artists";
  const supportsCta = supportsSlug;
  const metaLabel = contentType === "events" ? "Venue" : contentType === "artists" ? "Role or instrument" : contentType === "repertoire" ? "Composer" : "Instrument";
  return <><header className="admin-page-header"><p className="eyebrow">Edit {sectionTitles[contentType]}</p><h1>{item.title}</h1><p>Save changes, archive to remove it from public pages, or delete it permanently.</p></header><form className="admin-editor" action={updateAction}><label>Title<input name="title" defaultValue={item.title} required /></label>{supportsSlug && <label>Slug<input name="slug" defaultValue={item.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>}<label>{metaLabel}<input name="meta" defaultValue={item.meta} /></label>{contentType === "events" && <label>Starts at<input name="dateTime" type="datetime-local" defaultValue={item.dateTime} /></label>}<label>Status<select name="status" defaultValue={item.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>{supportsCta && <><label>Button text (optional)<input name="ctaLabel" defaultValue={item.ctaLabel ?? ""} /></label><label>Button link (optional)<input name="ctaUrl" defaultValue={item.ctaUrl ?? ""} placeholder="/contact or https://example.com" /></label></>}<label className="admin-editor__wide">Description<textarea name="summary" rows={5} defaultValue={item.summary} /></label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href={`/admin/${contentType}`}>Cancel</Link></div></form><section className="admin-danger"><h2>Delete {sectionTitles[contentType].slice(0, -1) || sectionTitles[contentType]}</h2><p>This permanently removes the record. Use Archived instead if you may need it again.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
