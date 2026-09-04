import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteNavigationItem, updateNavigationItem } from "@/lib/actions/website";
import { getAdminNavigationItem } from "@/lib/queries/website";

export const metadata = { title: "Edit Navigation · Website Admin" };

export default async function EditNavigationItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getAdminNavigationItem(id);
  if (!item) notFound();
  const updateAction = updateNavigationItem.bind(null, item.id);
  const deleteAction = deleteNavigationItem.bind(null, item.id);
  return <><header className="admin-page-header"><p className="eyebrow">Edit navigation item</p><h1>{item.label}</h1><p>Hide an item to remove it from the public header while keeping it for later use.</p></header><form className="admin-editor" action={updateAction}><label>Internal key<input name="itemKey" defaultValue={item.itemKey} pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Menu label<input name="label" defaultValue={item.label} required /></label><label className="admin-editor__wide">Link<input name="href" defaultValue={item.href} required /></label><label>Menu group<select name="groupName" defaultValue={item.groupName}><option value="main">Main navigation</option><option value="more">More menu</option></select></label><label>Position<input name="position" type="number" min="0" max="9999" defaultValue={item.position} required /></label><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked={item.visible} /> Show on public website</label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/website/navigation">Cancel</Link></div></form><section className="admin-danger"><h2>Delete navigation item</h2><p>This permanently removes the menu item. The linked page itself will not be deleted.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
