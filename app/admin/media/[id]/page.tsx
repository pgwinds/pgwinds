import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { deleteMedia, updateMedia } from "@/lib/actions/admin";
import { getAdminMediaAsset } from "@/lib/queries/admin-content";

export const metadata = { title: "Edit image · Admin" };

const focalPoints = [
  ["top-left", "Top left", 0, 0], ["top-center", "Top centre", 50, 0], ["top-right", "Top right", 100, 0],
  ["center-left", "Centre left", 0, 50], ["center", "Centre", 50, 50], ["center-right", "Centre right", 100, 50],
  ["bottom-left", "Bottom left", 0, 100], ["bottom-center", "Bottom centre", 50, 100], ["bottom-right", "Bottom right", 100, 100],
] as const;

export default async function EditMediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getAdminMediaAsset(id);
  if (!asset) notFound();
  const updateAction = updateMedia.bind(null, asset.id);
  const deleteAction = deleteMedia.bind(null, asset.id);
  const focalPoint = focalPoints.find(([, , x, y]) => x === asset.focalX && y === asset.focalY)?.[0] ?? "center";
  return <><header className="admin-page-header"><p className="eyebrow">Edit image</p><h1>Media details</h1><p>Keep the alt text descriptive and set the focal point for responsive cover crops.</p></header><div className="admin-media-preview"><Image className="admin-media-preview__crop" style={{ objectPosition: `${asset.focalX}% ${asset.focalY}%` }} src={asset.publicUrl} alt={asset.altText} width={1040} height={840} /><a href={asset.publicUrl} target="_blank" rel="noreferrer">Open full-size image</a></div><form className="admin-editor" action={updateAction}><label className="admin-editor__wide">Alt text<input name="altText" defaultValue={asset.altText} required /></label><label className="admin-editor__wide">Caption (optional)<textarea name="caption" rows={4} defaultValue={asset.caption} /></label><label className="admin-editor__wide">Keep this part of the image visible<select name="focalPoint" defaultValue={focalPoint}>{focalPoints.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><span className="admin-help">Use this for images cropped to fit cards, especially Repertoire covers.</span></label><div className="admin-editor__wide admin-form-actions"><button className="button" type="submit">Save changes</button><Link href="/admin/media">Cancel</Link></div></form><section className="admin-danger"><h2>Delete image</h2><p>This removes the image metadata and file. Images that are still in a gallery cannot be deleted until removed from that gallery.</p><form action={deleteAction}><button className="button button--danger" type="submit">Delete permanently</button></form></section></>;
}
