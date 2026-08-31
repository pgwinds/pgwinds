import { PageHero } from "@/components/shared/page-hero";
import { getPublicGalleries } from "@/lib/queries/galleries";

export const metadata = { title: "Gallery" };
const fallbackTiles = ["On stage", "In rehearsal", "Together", "Behind the scenes", "In motion", "In harmony"];

export default async function GalleryPage() {
  const galleries = await getPublicGalleries();
  const tiles = galleries.length > 0 ? galleries.map((gallery) => ({ id: gallery.id, title: gallery.title })) : fallbackTiles.map((title) => ({ id: title, title }));

  return <><PageHero label="Gallery" title="Moments in music." intro="A glimpse of the people, practice, and performances behind PGWINDS." /><section className="section"><div className="container gallery-grid">{tiles.map((tile, index) => <article className={`gallery-tile gallery-tile--${index + 1}`} key={tile.id}><span>{tile.title}</span></article>)}</div></section></>;
}
