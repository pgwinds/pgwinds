import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteConcert, updateConcert } from "@/lib/actions/admin";
import { getAdminConcert } from "@/lib/queries/admin-content";

export const metadata = { title: "Edit concert · Admin" };

export default async function EditConcertPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const concert = await getAdminConcert(id);
  if (!concert) notFound();
  const updateAction = updateConcert.bind(null, concert.id);
  const deleteAction = deleteConcert.bind(null, concert.id);
  return <><header className="admin-page-header"><p className="eyebrow">Edit concert</p><h1>{concert.title}</h1><p>Save changes, archive to remove it from public pages, or delete it permanently.</p></header><form className="admin-editor" action={updateAction}><label>Title<input name="title" defaultValue={concert.title} required /></label><label>Slug<input name="slug" defaultValue={concert.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Date label<input name="displayDate" defaultValue={concert.displayDate} required /></label><label>Starts at<input name="startsAt" type="datetime-local" defaultValue={concert.startsAt ? concert.startsAt.slice(0, 16) : ""} /></label><label>Venue<input name="venue" defaultValue={concert.venue} required /></label><label>Status<select name="status" defaultValue={concert.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Button text (optional)<input name="ctaLabel" defaultValue={concert.ctaLabel ?? ""} /></label><label>Button link (optional)<input name="ctaUrl" defaultValue={concert.ctaUrl ?? ""} placeholder="/contact or https://example.com" /></label><label className="admin-editor__wide">Description<textarea name="description" rows={5} defaultValue={concert.description} required /></label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/concerts">Cancel</Link></div></form><section className="admin-danger"><h2>Delete concert</h2><p>This permanently removes the concert record. Use Archived instead if you may need it again.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
