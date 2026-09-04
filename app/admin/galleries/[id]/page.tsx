import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { addImageToGallery, deleteGallery, removeImageFromGallery, updateGallery } from "@/lib/actions/admin";
import { getAdminGallery, getAdminGalleryImages, getAdminMediaAssets } from "@/lib/queries/admin-content";

export const metadata = { title: "Edit gallery · Admin" };

export default async function EditGalleryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [gallery, images, mediaAssets] = await Promise.all([getAdminGallery(id), getAdminGalleryImages(id), getAdminMediaAssets()]);
  if (!gallery) notFound();
  const updateAction = updateGallery.bind(null, gallery.id);
  const deleteAction = deleteGallery.bind(null, gallery.id);
  const addImageAction = addImageToGallery.bind(null, gallery.id);
  const attachedMediaIds = new Set(images.map((image) => image.id));
  const availableMedia = mediaAssets.filter((asset) => !attachedMediaIds.has(asset.id));

  return <><header className="admin-page-header"><p className="eyebrow">Edit gallery</p><h1>{gallery.title}</h1><p>Upload images to Media, attach them here, then publish the gallery to show the images publicly.</p></header><form className="admin-editor" action={updateAction}><label>Title<input name="title" defaultValue={gallery.title} required /></label><label>Slug<input name="slug" defaultValue={gallery.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label><label>Status<select name="status" defaultValue={gallery.status}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="admin-editor__wide">Description<textarea name="description" rows={5} defaultValue={gallery.description ?? ""} /></label><div className="admin-editor__wide admin-form-actions"><FormSubmitButton label="Save gallery" pendingLabel="Saving…" /><Link href="/admin/galleries">Cancel</Link></div></form><section className="admin-records admin-gallery-images"><header><h2>Images in this gallery</h2><p>Only these attached images appear on the public Gallery page.</p></header><form className="admin-editor" action={addImageAction}><label className="admin-editor__wide">Choose an image from Media<select name="mediaAssetId" required defaultValue=""><option value="" disabled>Select an uploaded image</option>{availableMedia.map((asset) => <option key={asset.id} value={asset.id}>{asset.altText}</option>)}</select></label>{availableMedia.length === 0 ? <p className="admin-editor__wide admin-help">Upload a new image in <Link href="/admin/media">Media</Link>, or all existing images are already attached.</p> : <FormSubmitButton label="Add image to gallery" pendingLabel="Adding image…" />}</form>{images.length === 0 ? <p className="admin-empty-copy">No images attached yet.</p> : <div className="admin-gallery-image-grid">{images.map((image) => { const removeAction = removeImageFromGallery.bind(null, gallery.id, image.galleryItemId); return <article key={image.galleryItemId}><Image src={image.publicUrl} alt={image.altText} width={640} height={480} /><div><strong>{image.altText}</strong>{image.caption && <span>{image.caption}</span>}<form action={removeAction}><FormSubmitButton className="admin-text-button" label="Remove from gallery" pendingLabel="Removing…" /></form></div></article>; })}</div>}</section><section className="admin-danger"><h2>Delete gallery</h2><p>This permanently removes the gallery and its image links. Uploaded images remain in Media and can be reused elsewhere.</p><form action={deleteAction}><FormSubmitButton className="button button--danger" label="Delete permanently" pendingLabel="Deleting…" /></form></section></>;
}
