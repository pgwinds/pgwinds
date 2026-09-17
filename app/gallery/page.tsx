import { PageHero } from "@/components/shared/page-hero";
import { GalleryContent } from "@/components/public/gallery-content";
import { getPublicGalleries } from "@/lib/queries/galleries";
import { getPublishedCollectionAppearance } from "@/lib/queries/website";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  const [galleries, appearance] = await Promise.all([getPublicGalleries(), getPublishedCollectionAppearance("gallery")]);
  return <><PageHero label="Gallery" title={appearance.content.hero.title} intro={appearance.content.hero.intro} backgroundImageUrl={appearance.heroImageUrl} overlay={appearance.content.hero.overlay} /><GalleryContent galleries={galleries} emptyTitle="No galleries yet." emptyBody="New photographic stories will appear here once they are published." /></>;
}
