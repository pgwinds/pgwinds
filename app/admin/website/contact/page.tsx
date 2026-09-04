import Link from "next/link";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { publishContactContent, saveContactDraft } from "@/lib/actions/website";
import { getAdminContactContent } from "@/lib/queries/website";
import type { Locale } from "@/lib/i18n/shared";

export const metadata = { title: "Contact · Website Admin" };

export default async function ContactWebsiteEditorPage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  const locale: Locale = (await searchParams).locale === "th" ? "th" : "en";
  const { draft, published } = await getAdminContactContent(locale);
  const preview = locale === "th" ? "/preview/contact?locale=th" : "/preview/contact";
  return <><header className="admin-page-header"><p className="eyebrow">Website / Contact</p><h1>Contact page</h1><p>Edit the {locale === "th" ? "Thai" : "English"} contact page. Only completed fields appear publicly.</p><LocaleTabs href="/admin/website/contact" locale={locale} />{published && <p className="admin-published-note">A published {locale === "th" ? "Thai" : "English"} configuration is currently live.</p>}</header><form className="admin-editor admin-editor--website" action={saveContactDraft}><input name="locale" type="hidden" value={locale} /><fieldset className="admin-editor__wide"><legend>Contact page copy</legend><div className="admin-field-grid"><label className="admin-field-grid__wide">Page title<input name="heroTitle" defaultValue={draft.hero.title} required /></label><label className="admin-field-grid__wide">Intro<textarea name="heroIntro" rows={4} defaultValue={draft.hero.intro} required /></label></div></fieldset><fieldset className="admin-editor__wide"><legend>Contact details</legend><div className="admin-field-grid"><label>Email<input name="email" type="email" defaultValue={draft.email ?? ""} placeholder="contact@example.com" /></label><label>Phone<input name="phone" defaultValue={draft.phone ?? ""} placeholder="+66 ..." /></label><label className="admin-field-grid__wide">Address<textarea name="address" rows={4} defaultValue={draft.address ?? ""} /></label></div></fieldset><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save draft</button><button className="button button--secondary" formAction={publishContactContent}>Publish Contact</button><Link href={preview}>Preview draft</Link><Link href={locale === "th" ? "/th/contact" : "/contact"}>Preview published page</Link></div></form></>;
}
