import Link from "next/link";
import { createSocialLink } from "@/lib/actions/website";
import { getAdminSocialLinks } from "@/lib/queries/website";

export const metadata = { title: "Social Links · Website Admin" };

export default async function SocialLinksAdminPage() {
  const links = await getAdminSocialLinks();
  return <><header className="admin-page-header"><p className="eyebrow">Website / Social Links</p><h1>Social links</h1><p>Add only channels that PGWINDS actively uses. Lower position values appear first.</p></header><form className="admin-editor" action={createSocialLink}><label>Platform<input name="platform" placeholder="Instagram" required /></label><label>Label (optional)<input name="label" placeholder="Follow us on Instagram" /></label><label className="admin-editor__wide">Full URL<input name="url" type="url" placeholder="https://instagram.com/..." required /></label><label>Position<input name="position" type="number" min="0" defaultValue="0" required /></label><label className="admin-toggle"><input name="visible" type="checkbox" defaultChecked /> Show on public website</label><button className="button" type="submit">Add social link</button></form><section className="admin-records"><h2>Existing links</h2>{links.length === 0 ? <p>No social links yet.</p> : <div>{links.map((link) => <article key={link.id}><div><strong>{link.platform}</strong><span>{link.url} · position {link.position}</span></div><div className="admin-record-actions"><em>{link.visible ? "Visible" : "Hidden"}</em><Link href={`/admin/website/social-links/${link.id}`}>Edit</Link></div></article>)}</div>}</section></>;
}
