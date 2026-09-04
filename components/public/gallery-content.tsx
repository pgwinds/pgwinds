import { GalleryCarousel } from "@/components/public/gallery-carousel";
import type { PublicGallery } from "@/lib/queries/galleries";

export function GalleryContent({ galleries, emptyTitle, emptyBody }: { galleries: PublicGallery[]; emptyTitle: string; emptyBody: string }) {
  if (galleries.length === 0) return <section className="section"><div className="container"><div className="empty-state"><h2>{emptyTitle}</h2><p>{emptyBody}</p></div></div></section>;

  return <section className="section"><div className="container gallery-collections">{galleries.map((gallery) => <section className="gallery-collection" key={gallery.id}><header><p className="eyebrow">Gallery</p><h2>{gallery.title}</h2>{gallery.description && <p>{gallery.description}</p>}</header>{gallery.images.length === 0 ? <p className="gallery-collection__empty">This gallery has no published images yet.</p> : <GalleryCarousel images={gallery.images} />}</section>)}</div></section>;
}
