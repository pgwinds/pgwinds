import { NavigationManager } from "@/components/admin/navigation-manager";
import { createNavigationItem, saveNavigationLayout } from "@/lib/actions/website";
import { getAdminNavigationItems } from "@/lib/queries/website";

export const metadata = { title: "Navigation · Website Admin" };

export default async function NavigationAdminPage() {
  const items = await getAdminNavigationItems();
  const mainItems = items.filter((item) => item.groupName === "main");
  const moreItems = items.filter((item) => item.groupName === "more");

  return <><header className="admin-page-header"><p className="eyebrow">Website / Navigation</p><h1>Navigation</h1><p>Main holds up to 3 high-priority links. Move the first More item up, or send any Main item down, then save the complete layout once.</p></header><form className="admin-editor" action={createNavigationItem}><label>Internal key<input name="itemKey" placeholder="support-us" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><label>Menu label<input name="label" placeholder="Support us" required /></label><label className="admin-editor__wide">Link<input name="href" placeholder="/support-us or https://..." required /></label><input name="groupName" type="hidden" value="more" /><input name="position" type="hidden" value="0" /><p className="admin-editor__wide admin-form-note">New menu items begin in More. Use the controls below to move the first More item into Main.</p><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked /> Show on public website</label><button className="button" type="submit">Add navigation item</button></form><NavigationManager initialMainItems={mainItems} initialMoreItems={moreItems} saveLayoutAction={saveNavigationLayout} /></>;
}
