import type { Concert } from "@/types/content";

export const navigation = [
  { label: "About", href: "/about" }, { label: "Concerts", href: "/concerts" }, { label: "News", href: "/news" }, { label: "Gallery", href: "/gallery" }, { label: "Contact", href: "/contact" },
];

export const pillars = [
  { number: "01", title: "Perform", description: "Sharing vibrant wind music with audiences near and far." },
  { number: "02", title: "Learn", description: "Developing musicianship through curiosity, practice, and mentorship." },
  { number: "03", title: "Belong", description: "Building friendships and memories that last beyond every concert." },
];

export const featuredConcert: Concert = {
  id: "coming-soon",
  slug: "a-new-season-awaits",
  title: "A new season awaits",
  displayDate: "Concert details coming soon",
  venue: "Prince of Songkla University",
  description: "Our next chapter is taking shape. Watch this space for performance announcements.",
  startsAt: null,
  status: "published",
  publishedAt: null,
};

export const concerts: Concert[] = [
  featuredConcert,
  { id: "archive-coming-soon", slug: "past-performances", title: "Past performances", displayDate: "Archive coming soon", venue: "PGWINDS", description: "Our concert archive will celebrate the music and moments that brought us here.", startsAt: null, status: "published", publishedAt: null },
];
