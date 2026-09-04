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
  ctaLabel?: string | null;
  ctaUrl?: string | null;
};

export type Gallery = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: ContentStatus;
  publishedAt: string | null;
};

export type Repertoire = {
  id: string;
  slug: string;
  title: string;
  composer: string | null;
  arranger: string | null;
  instrumentation: string | null;
  notes: string | null;
  coverMediaId: string | null;
  youtubeUrl: string | null;
  status: ContentStatus;
  publishedAt: string | null;
};
