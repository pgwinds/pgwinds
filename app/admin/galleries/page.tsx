import { ContentOrderManager } from "@/components/admin/content-order-manager";
import { createGallery, saveContentOrder } from "@/lib/actions/admin";
import { getAdminGalleries } from "@/lib/queries/admin-content";

export const metadata = { title: "Admin · Galleries" };

export default async function AdminGalleriesPage() {
  const galleries = await getAdminGalleries();
  const saveOrderAction = saveContentOrder.bind(null, "galleries");
  return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>Galleries</h1><p>Create a gallery, open it to attach images from Media, then publish it to the public Gallery page.</p></header><form className="admin-editor" action={createGallery}><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="concert-season-2026" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Description<textarea name="description" rows={5} /></label><button className="button" type="submit">Create gallery</button></form><ContentOrderManager heading="Existing galleries" emptyMessage="No records yet." saveOrderAction={saveOrderAction} items={galleries.map((gallery) => ({ id: gallery.id, title: gallery.title, subtitle: gallery.description || "No description", status: gallery.status, href: `/admin/galleries/${gallery.id}`, actionLabel: "Manage images" }))} /></>;
}
