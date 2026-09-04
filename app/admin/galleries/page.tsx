import Link from "next/link";
import { createGallery } from "@/lib/actions/admin";
import { getAdminGalleries } from "@/lib/queries/admin-content";

export const metadata = { title: "Admin · Galleries" };

export default async function AdminGalleriesPage() {
  const galleries = await getAdminGalleries();
  return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>Galleries</h1><p>Create a gallery, open it to attach images from Media, then publish it to the public Gallery page.</p></header><form className="admin-editor" action={createGallery}><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="concert-season-2026" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Description<textarea name="description" rows={5} /></label><button className="button" type="submit">Create gallery</button></form><section className="admin-records"><h2>Existing galleries</h2>{galleries.length === 0 ? <p>No records yet.</p> : <div>{galleries.map((gallery) => <article key={gallery.id}><div><strong>{gallery.title}</strong><span>{gallery.description || "No description"}</span></div><div className="admin-record-actions"><em>{gallery.status}</em><Link href={`/admin/galleries/${gallery.id}`}>Manage images</Link></div></article>)}</div>}</section></>;
}
