import { ContentOrderManager } from "@/components/admin/content-order-manager";
import { MediaPicker } from "@/components/admin/media-picker";
import { createRepertoire, saveContentOrder } from "@/lib/actions/admin";
import { getAdminMediaPickerAssets } from "@/lib/queries/admin-content";
import { getAdminRepertoire } from "@/lib/queries/repertoire";

export const metadata = { title: "Admin · Repertoire" };

export default async function AdminRepertoirePage() {
  const [items, assets] = await Promise.all([getAdminRepertoire(), getAdminMediaPickerAssets()]);
  const saveOrderAction = saveContentOrder.bind(null, "repertoire");
  return <><header className="admin-page-header"><p className="eyebrow">Portfolio</p><h1>Repertoire</h1><p>Document the works PGWINDS performs and link audiences to recordings on YouTube.</p></header><form className="admin-editor admin-editor--website" action={createRepertoire}><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="concertino-for-clarinet" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Composer<input name="composer" /></label><label>Arranger (optional)<input name="arranger" /></label><label className="admin-editor__wide">Instrumentation<input name="instrumentation" placeholder="Wind symphony, solo clarinet" /></label><MediaPicker name="coverMediaId" label="Cover image (optional)" assets={assets} defaultValue={null} /><label>YouTube URL (optional)<input name="youtubeUrl" type="url" placeholder="https://youtube.com/..." /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Portfolio description<textarea name="notes" rows={6} /></label><p className="admin-editor__wide admin-help">A YouTube URL automatically displays a “Watch on YouTube” button on the public portfolio.</p><button className="button" type="submit">Add repertoire item</button></form><ContentOrderManager heading="Existing repertoire" emptyMessage="No repertoire items yet." saveOrderAction={saveOrderAction} items={items.map((item) => ({ id: item.id, title: item.title, subtitle: [item.composer, item.instrumentation].filter(Boolean).join(" · ") || "No details", status: item.status, href: `/admin/repertoire/${item.id}` }))} /></>;
}
