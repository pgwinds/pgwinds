import { z } from "zod";

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const status = z.enum(["draft", "published", "archived"]);

export const concertSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug,
  description: z.string().trim().max(4000),
  venue: z.string().trim().max(180),
  displayDate: z.string().trim().max(120),
  startsAt: z.string().trim().optional(),
  status,
});

export const gallerySchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug,
  description: z.string().trim().max(2000).optional(),
  status,
});

export const programmeSchema = z.object({
  contentType: z.enum(["news", "events", "artists", "repertoire", "members", "alumni"]),
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().optional(),
  summary: z.string().trim().max(4000).optional(),
  meta: z.string().trim().max(180).optional(),
  dateTime: z.string().trim().optional(),
  status: z.enum(["draft", "published", "archived"]),
});
