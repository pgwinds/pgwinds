import { PageHero } from "@/components/shared/page-hero";
import { GalleryContent } from "@/components/public/gallery-content";
import { getPublicGalleries } from "@/lib/queries/galleries";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const galleries = await getPublicGalleries();
  return <><PageHero label="Gallery" title="Moments in music." intro="A glimpse of the people, practice, and performances behind PGWINDS." /><GalleryContent galleries={galleries} emptyTitle="No galleries yet." emptyBody="New photographic stories will appear here once they are published." /></>;
}
