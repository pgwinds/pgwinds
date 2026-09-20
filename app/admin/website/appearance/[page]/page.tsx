import { notFound } from "next/navigation";
import Link from "next/link";
import { LocaleTabs } from "@/components/admin/locale-tabs";
import { MediaPicker } from "@/components/admin/media-picker";
import { publishCollectionAppearance, saveCollectionAppearanceDraft } from "@/lib/actions/website";
import { getAdminMediaPickerAssets } from "@/lib/queries/admin-content";
import { collectionAppearancePages, getAdminCollectionAppearance, type CollectionAppearancePage } from "@/lib/queries/website";
import type { Locale } from "@/lib/i18n/shared";

const pageNames: Record<CollectionAppearancePage, string> = { gallery: "Gallery", artists: "Artists", repertoire: "Repertoire" };

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  return { title: collectionAppearancePages.includes(page as CollectionAppearancePage) ? `${pageNames[page as CollectionAppearancePage]} appearance · Website Admin` : "Not found" };
}

export default async function CollectionAppearanceEditorPage({ params, searchParams }: { params: Promise<{ page: string }>; searchParams: Promise<{ locale?: string }> }) {
  const [{ page }, { locale: localeParam }] = await Promise.all([params, searchParams]);
  if (!collectionAppearancePages.includes(page as CollectionAppearancePage)) notFound();
  const pageKey = page as CollectionAppearancePage;
  const locale: Locale = localeParam === "th" ? "th" : "en";
  const [{ draft, published }, assets] = await Promise.all([getAdminCollectionAppearance(pageKey, locale), getAdminMediaPickerAssets()]);
  const name = pageNames[pageKey];
  const basePath = `/admin/website/appearance/${pageKey}`;
  const previewPath = locale === "th" ? `/preview/${pageKey}?locale=th` : `/preview/${pageKey}`;
  const publishedPath = locale === "th" ? `/th/${pageKey}` : `/${pageKey}`;
  return <><header className="admin-page-header"><p className="eyebrow">Website / Appearance</p><h1>{name} appearance</h1><p>Set the public hero title, introductory copy, background image, and overlay for the {locale === "th" ? "Thai" : "English"} page.</p><LocaleTabs href={basePath} locale={locale} />{published && <p className="admin-published-note">A published {locale === "th" ? "Thai" : "English"} configuration is currently live.</p>}</header><form className="admin-editor admin-editor--website" action={saveCollectionAppearanceDraft}><input name="pageKey" type="hidden" value={pageKey} /><input name="locale" type="hidden" value={locale} /><fieldset className="admin-editor__wide"><legend>Hero</legend><div className="admin-field-grid"><label className="admin-field-grid__wide">Page title<input name="heroTitle" defaultValue={draft.hero.title} required /></label><label className="admin-field-grid__wide">Intro<textarea name="heroIntro" rows={4} defaultValue={draft.hero.intro} required /></label><label>Overlay darkness<select name="heroOverlay" defaultValue={String(draft.hero.overlay)}><option value="0">None</option><option value="20">Light</option><option value="40">Medium</option><option value="60">Dark</option><option value="80">Very dark</option></select></label><MediaPicker name="heroMediaId" label="Hero background image (optional)" assets={assets} defaultValue={draft.hero.mediaId} /></div></fieldset><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save draft</button><button className="button button--secondary" formAction={publishCollectionAppearance}>Publish {name}</button><Link href={previewPath}>Preview draft</Link><Link href={publishedPath}>Preview published page</Link></div></form></>;
}
