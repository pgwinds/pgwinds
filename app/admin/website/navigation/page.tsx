import { ContentOrderManager } from "@/components/admin/content-order-manager";
import { createNavigationItem, saveNavigationOrder } from "@/lib/actions/website";
import { getAdminNavigationItems } from "@/lib/queries/website";

export const metadata = { title: "Navigation · Website Admin" };

export default async function NavigationAdminPage() {
  const items = await getAdminNavigationItems();
  const mainItems = items.filter((item) => item.groupName === "main");
  const moreItems = items.filter((item) => item.groupName === "more");

  return <><header className="admin-page-header"><p className="eyebrow">Website / Navigation</p><h1>Navigation</h1><p>Control the public menu without changing source code, then arrange each menu group below.</p></header><form className="admin-editor" action={createNavigationItem}><label>Internal key<input name="itemKey" placeholder="support-us" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Menu label<input name="label" placeholder="Support us" required /></label><label className="admin-editor__wide">Link<input name="href" placeholder="/support-us or https://..." required /></label><label>Menu group<select name="groupName" defaultValue="more"><option value="main">Main navigation</option><option value="more">More menu</option></select></label><input name="position" type="hidden" value="0" /><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked /> Show on public website</label><button className="button" type="submit">Add navigation item</button></form><NavigationGroup title="Main navigation" description="Links shown directly in the header." items={mainItems} groupName="main" /><NavigationGroup title="More menu" description="Links grouped under More in the header." items={moreItems} groupName="more" /></>;
}

function NavigationGroup({ title, description, items, groupName }: { title: string; description: string; items: Awaited<ReturnType<typeof getAdminNavigationItems>>; groupName: "main" | "more" }) {
  const saveOrderAction = saveNavigationOrder.bind(null, groupName);
  return <><p className="admin-content-order__description">{description}</p><ContentOrderManager heading={title} emptyMessage="No navigation items in this group." saveOrderAction={saveOrderAction} items={items.map((item) => ({ id: item.id, title: item.label, subtitle: `${item.href} · key: ${item.itemKey}`, status: item.visible ? "Visible" : "Hidden", href: `/admin/website/navigation/${item.id}` }))} /></>;
}
