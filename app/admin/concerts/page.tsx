import { ContentOrderManager } from "@/components/admin/content-order-manager";
import { createConcert, saveContentOrder } from "@/lib/actions/admin";
import { getAdminConcerts } from "@/lib/queries/admin-content";

export const metadata = { title: "Admin · Concerts" };

export default async function AdminConcertsPage() {
  const concerts = await getAdminConcerts();
  const saveOrderAction = saveContentOrder.bind(null, "concerts");
  return <><header className="admin-page-header"><p className="eyebrow">Content</p><h1>Concerts</h1><p>Create an upcoming performance or prepare an archive record.</p></header><form className="admin-editor" action={createConcert}><label>Title<input name="title" required /></label><label>Slug<input name="slug" placeholder="spring-concert-2026" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Date label<input name="displayDate" placeholder="12 October 2026" required /></label><label>Starts at<input name="startsAt" type="datetime-local" /></label><label>Venue<input name="venue" required /></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label>Button text (optional)<input name="ctaLabel" placeholder="Learn more" /></label><label>Button link (optional)<input name="ctaUrl" placeholder="/contact or https://example.com" /></label><p className="admin-editor__wide admin-help">If you enter only a link, the button will be named “Learn more”.</p><label className="admin-editor__wide">Description<textarea name="description" rows={5} required /></label><button className="button" type="submit">Create concert</button></form><ContentOrderManager heading="Existing concerts" emptyMessage="No records yet." saveOrderAction={saveOrderAction} items={concerts.map((concert) => ({ id: concert.id, title: concert.title, subtitle: `${concert.displayDate} · ${concert.venue}`, status: concert.status, href: `/admin/concerts/${concert.id}` }))} /></>;
}
