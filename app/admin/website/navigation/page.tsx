import Link from "next/link";
import { createNavigationItem } from "@/lib/actions/website";
import { getAdminNavigationItems } from "@/lib/queries/website";

export const metadata = { title: "Navigation · Website Admin" };

export default async function NavigationAdminPage() {
  const items = await getAdminNavigationItems();
  const mainItems = items.filter((item) => item.groupName === "main");
  const moreItems = items.filter((item) => item.groupName === "more");

  return <><header className="admin-page-header"><p className="eyebrow">Website / Navigation</p><h1>Navigation</h1><p>Control the public menu without changing source code. Lower position values appear first.</p></header><form className="admin-editor" action={createNavigationItem}><label>Internal key<input name="itemKey" placeholder="support-us" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Menu label<input name="label" placeholder="Support us" required /></label><label className="admin-editor__wide">Link<input name="href" placeholder="/support-us or https://..." required /></label><label>Menu group<select name="groupName" defaultValue="more"><option value="main">Main navigation</option><option value="more">More menu</option></select></label><label>Position<input name="position" type="number" min="0" max="9999" defaultValue="0" required /></label><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked /> Show on public website</label><button className="button" type="submit">Add navigation item</button></form><NavigationGroup title="Main navigation" description="Links shown directly in the header." items={mainItems} /><NavigationGroup title="More menu" description="Links grouped under More in the header." items={moreItems} /></>;
}

function NavigationGroup({ title, description, items }: { title: string; description: string; items: Awaited<ReturnType<typeof getAdminNavigationItems>> }) {
  return <section className="admin-records"><h2>{title}</h2><p>{description}</p>{items.length === 0 ? <p>No navigation items in this group.</p> : <div>{items.map((item) => <article key={item.id}><div><strong>{item.label}</strong><span>{item.href} · key: {item.itemKey} · position {item.position}</span></div><div className="admin-record-actions"><em>{item.visible ? "Visible" : "Hidden"}</em><Link href={`/admin/website/navigation/${item.id}`}>Edit</Link></div></article>)}</div>}</section>;
}
