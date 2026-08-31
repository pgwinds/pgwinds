import { createGallery } from "@/lib/actions/admin";

export const metadata = { title: "Admin · Galleries" };

export default function AdminGalleriesPage() { return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>Galleries</h1><p>Create a gallery first, then attach media in the next iteration.</p></header><form className="admin-editor" action={createGallery}><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="concert-season-2026" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Description<textarea name="description" rows={5} /></label><button className="button" type="submit">Create gallery</button></form></>; }
