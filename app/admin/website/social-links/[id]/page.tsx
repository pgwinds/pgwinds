import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSocialLink, updateSocialLink } from "@/lib/actions/website";
import { getAdminSocialLink } from "@/lib/queries/website";

export const metadata = { title: "Edit Social Link · Website Admin" };

export default async function EditSocialLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const link = await getAdminSocialLink(id);
  if (!link) notFound();
  const updateAction = updateSocialLink.bind(null, link.id);
  const deleteAction = deleteSocialLink.bind(null, link.id);
  return <><header className="admin-page-header"><p className="eyebrow">Edit social link</p><h1>{link.platform}</h1><p>Hide a link to remove it from public pages without deleting it.</p></header><form className="admin-editor" action={updateAction}><label>Platform<input name="platform" defaultValue={link.platform} required /></label><label>Label (optional)<input name="label" defaultValue={link.label ?? ""} /></label><label className="admin-editor__wide">Full URL<input name="url" type="url" defaultValue={link.url} required /></label><label>Position<input name="position" type="number" min="0" defaultValue={link.position} required /></label><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked={link.visible} /> Show on public website</label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/website/social-links">Cancel</Link></div></form><section className="admin-danger"><h2>Delete social link</h2><p>This permanently removes the social link.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
