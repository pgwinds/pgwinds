import { ContentOrderManager } from "@/components/admin/content-order-manager";
import { createSocialLink, saveSocialLinkOrder } from "@/lib/actions/website";
import { getAdminSocialLinks } from "@/lib/queries/website";

export const metadata = { title: "Social Links · Website Admin" };

export default async function SocialLinksAdminPage() {
  const links = await getAdminSocialLinks();
  return <><header className="admin-page-header"><p className="eyebrow">Website / Social Links</p><h1>Social links</h1><p>Add only channels that PGWINDS actively uses, then arrange their public display order below.</p></header><form className="admin-editor" action={createSocialLink}><label>Platform<input name="platform" placeholder="Instagram" required /></label><label>Label (optional)<input name="label" placeholder="Follow us on Instagram" /></label><label className="admin-editor__wide">Full URL<input name="url" type="url" placeholder="https://instagram.com/..." required /></label><input name="position" type="hidden" value="0" /><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked /> Show on public website</label><button className="button" type="submit">Add social link</button></form><ContentOrderManager heading="Existing links" emptyMessage="No social links yet." saveOrderAction={saveSocialLinkOrder} items={links.map((link) => ({ id: link.id, title: link.platform, subtitle: link.url, status: link.visible ? "Visible" : "Hidden", href: `/admin/website/social-links/${link.id}` }))} /></>;
}
