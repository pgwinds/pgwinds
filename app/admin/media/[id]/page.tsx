import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { deleteMedia, updateMedia } from "@/lib/actions/admin";
import { getAdminMediaAsset } from "@/lib/queries/admin-content";

export const metadata = { title: "Edit image · Admin" };

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAdminMediaAsset(id);
  if (!asset) notFound();
  const updateAction = updateMedia.bind(null, asset.id);
  const deleteAction = deleteMedia.bind(null, asset.id);
  return <><header className="admin-page-header"><p className="eyebrow">Edit image</p><h1>Media details</h1><p>Keep the alt text descriptive so the image remains accessible.</p></header><div className="admin-media-preview"><Image src={asset.publicUrl} alt={asset.altText} width={1040} height={840} /><a href={asset.publicUrl} target="_blank" rel="noreferrer">Open full-size image</a></div><form className="admin-editor" action={updateAction}><label className="admin-editor__wide">Alt text<input name="altText" defaultValue={asset.altText} required /></label><label className="admin-editor__wide">Caption (optional)<textarea name="caption" rows={4} defaultValue={asset.caption} /></label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/media">Cancel</Link></div></form><section className="admin-danger"><h2>Delete image</h2><p>This removes the image metadata and file. Images that are still in a gallery cannot be deleted until removed from that gallery.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
