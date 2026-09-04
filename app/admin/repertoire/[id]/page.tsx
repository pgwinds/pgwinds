import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaPicker } from "@/components/admin/media-picker";
import { deleteRepertoire, updateRepertoire } from "@/lib/actions/admin";
import { getAdminMediaAssets } from "@/lib/queries/admin-content";
import { getAdminRepertoireItem } from "@/lib/queries/repertoire";

export const metadata = { title: "Edit Repertoire · Admin" };

export default async function EditRepertoirePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, assets] = await Promise.all([getAdminRepertoireItem(id), getAdminMediaAssets()]);
  if (!item) notFound();
  const updateAction = updateRepertoire.bind(null, item.id);
  const deleteAction = deleteRepertoire.bind(null, item.id);
  return <><header className="admin-page-header"><p className="eyebrow">Edit repertoire</p><h1>{item.title}</h1><p>Publish it to the public portfolio, archive it, or remove it permanently.</p></header><form className="admin-editor admin-editor--website" action={updateAction}><label>Title<input name="title" defaultValue={item.title} required /></label><label>Slug<input name="slug" defaultValue={item.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Composer<input name="composer" defaultValue={item.composer ?? ""} /></label><label>Arranger (optional)<input name="arranger" defaultValue={item.arranger ?? ""} /></label><label className="admin-editor__wide">Instrumentation<input name="instrumentation" defaultValue={item.instrumentation ?? ""} /></label><MediaPicker name="coverMediaId" label="Cover image (optional)" assets={assets} defaultValue={item.coverMediaId} /><label>YouTube URL (optional)<input name="youtubeUrl" type="url" defaultValue={item.youtubeUrl ?? ""} /></label><label>Status<select name="status" defaultValue={item.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Portfolio description<textarea name="notes" rows={6} defaultValue={item.notes ?? ""} /></label><p className="admin-editor__wide admin-help">A YouTube URL automatically displays a “Watch on YouTube” button on the public portfolio.</p><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/repertoire">Cancel</Link></div></form><section className="admin-danger"><h2>Delete repertoire item</h2><p>This permanently removes the portfolio entry. Use Archived if it may be needed again.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
