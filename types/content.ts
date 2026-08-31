export type ContentStatus = "draft" | "published" | "archived";

export type Concert = {
  id: string;
  slug: string;
  title: string;
  description: string;
  venue: string;
  displayDate: string;
  startsAt: string | null;
  status: ContentStatus;
  publishedAt: string | null;
};

export type Gallery = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  publishedAt: string | null;
};
