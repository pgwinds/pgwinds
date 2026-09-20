import Link from "next/link";
import { notFound } from "next/navigation";
import { FormSubmitButton } from "@/components/admin/form-submit-button";
import { GalleryImageManager } from "@/components/admin/gallery-image-manager";
import { MediaPicker } from "@/components/admin/media-picker";
import {
  addAlbumToGallery,
  addImageToGallery,
  deleteGallery,
  updateGallery,
} from "@/lib/actions/admin";
import {
  getAdminGallery,
  getAdminGalleryImages,
  getAdminMediaLibrary,
} from "@/lib/queries/admin-content";

export const metadata = { title: "Edit gallery · Admin" };

const imageFeedback = {
  added: { className: "admin-success", message: "เพิ่มรูปเข้า Gallery เรียบร้อยแล้ว" },
  "album-added": { className: "admin-success", message: "เพิ่มรูปทั้งหมดที่ยังไม่ซ้ำจาก Album เข้า Gallery เรียบร้อยแล้ว" },
  "select-required": { className: "admin-form-feedback is-error", message: "กรุณาคลิกรูปที่ต้องการก่อนกดเพิ่มเข้า Gallery" },
  "album-required": { className: "admin-form-feedback is-error", message: "กรุณาเลือก Album ก่อนกดเพิ่มทั้ง Album" },
  "already-added": { className: "admin-form-feedback is-error", message: "รูปนี้อยู่ใน Gallery นี้แล้ว" },
  "album-empty": { className: "admin-form-feedback is-error", message: "Album นี้ไม่มีรูปใหม่สำหรับเพิ่ม (รูปอาจอยู่ใน Gallery ครบแล้ว)" },
  error: { className: "admin-form-feedback is-error", message: "ไม่สามารถเพิ่มรูปได้ในขณะนี้ กรุณาลองใหม่" },
};

const orderFeedback = {
  saved: { className: "admin-success", message: "บันทึกลำดับรูปใน Gallery เรียบร้อยแล้ว" },
  stale: { className: "admin-form-feedback is-error", message: "รายการรูปมีการเปลี่ยนแปลงจากที่เปิดไว้ กรุณารีเฟรชแล้วจัดลำดับใหม่" },
  error: { className: "admin-form-feedback is-error", message: "ไม่สามารถเปลี่ยนลำดับรูปได้ในขณะนี้ กรุณาลองใหม่" },
};

export default async function EditGalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ image?: string; order?: string }>;
}) {
  const { id } = await params;
  const [gallery, images, library, query] = await Promise.all([
    getAdminGallery(id),
    getAdminGalleryImages(id),
    getAdminMediaLibrary(),
    searchParams,
  ]);

  if (!gallery) notFound();

  const updateAction = updateGallery.bind(null, gallery.id);
  const deleteAction = deleteGallery.bind(null, gallery.id);
  const addImageAction = addImageToGallery.bind(null, gallery.id);
  const addAlbumAction = addAlbumToGallery.bind(null, gallery.id);
  const attachedMediaIds = new Set(images.map((image) => image.id));
  const availableMedia = library.assets.filter((asset) => !attachedMediaIds.has(asset.id));
  const feedback = query.image && query.image in imageFeedback
    ? imageFeedback[query.image as keyof typeof imageFeedback]
    : null;
  const orderMessage = query.order && query.order in orderFeedback
    ? orderFeedback[query.order as keyof typeof orderFeedback]
    : null;

  return (
    <>
      <header className="admin-page-header">
        <p className="eyebrow">Edit gallery</p>
        <h1>{gallery.title}</h1>
        <p>Upload images to Media, attach them here, then publish the gallery to show the images publicly.</p>
      </header>

      <form className="admin-editor" action={updateAction}>
        <label>
          Title
          <input name="title" defaultValue={gallery.title} required />
        </label>
        <label>
          Slug
          <input name="slug" defaultValue={gallery.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
        </label>
        <label>
          Status
          <select name="status" defaultValue={gallery.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="admin-editor__wide">
          Description
          <textarea name="description" rows={5} defaultValue={gallery.description ?? ""} />
        </label>
        <div className="admin-editor__wide admin-form-actions">
          <FormSubmitButton label="Save gallery" pendingLabel="Saving…" />
          <Link href="/admin/galleries">Cancel</Link>
        </div>
      </form>

      <section className="admin-records admin-gallery-images">
        <header>
          <h2>Images in this gallery</h2>
          <p>Only these attached images appear on the public Gallery page.</p>
        </header>
        {feedback && <p className={feedback.className}>{feedback.message}</p>}
        {orderMessage && <p className={orderMessage.className}>{orderMessage.message}</p>}

        <form className="admin-editor" action={addImageAction}>
          {availableMedia.length === 0 ? (
            <p className="admin-editor__wide admin-help">
              Upload a new image in <Link href="/admin/media">Media</Link>, or all existing images are already attached.
            </p>
          ) : (
            <>
              <MediaPicker
                name="mediaAssetId"
                label="เลือกหนึ่งรูปจาก Media"
                assets={availableMedia}
                defaultValue={null}
                optional={false}
                requireAlbumSelection
              />
              <FormSubmitButton label="เพิ่มรูปที่เลือกเข้า Gallery" pendingLabel="กำลังเพิ่มรูป…" />
            </>
          )}
        </form>

        {library.organizationAvailable && library.albums.length > 0 && (
          <form className="admin-inline-form" action={addAlbumAction}>
            <label>
              เพิ่มทั้ง Album
              <select name="albumId" defaultValue="" required>
                <option value="" hidden>เลือก Album</option>
                {library.albums.map((album) => <option key={album.id} value={album.id}>{album.name}</option>)}
              </select>
            </label>
            <FormSubmitButton label="เพิ่มทั้ง Album เข้า Gallery" pendingLabel="กำลังเพิ่ม Album…" />
          </form>
        )}

        {images.length === 0 ? (
          <p className="admin-empty-copy">No images attached yet.</p>
        ) : (
          <GalleryImageManager galleryId={gallery.id} initialImages={images} />
        )}
      </section>

      <section className="admin-danger">
        <h2>Delete gallery</h2>
        <p>This permanently removes the gallery and its image links. Uploaded images remain in Media and can be reused elsewhere.</p>
        <form action={deleteAction}>
          <FormSubmitButton className="button button--danger" label="Delete permanently" pendingLabel="Deleting…" />
        </form>
      </section>
    </>
  );
}
