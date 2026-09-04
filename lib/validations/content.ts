import { z } from "zod";

const slug = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");
const status = z.enum(["draft", "published", "archived"]);
const optionalLinkUrl = z.string().trim().max(2000).optional().refine((value) => !value || (/^https?:\/\//.test(value) || (value.startsWith("/") && !value.startsWith("//"))), "Use a full http(s) URL or a site path starting with /.");
const optionalLinkLabel = z.string().trim().max(80).optional();

export const concertSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug,
  description: z.string().trim().max(4000),
  venue: z.string().trim().max(180),
  displayDate: z.string().trim().max(120),
  startsAt: z.string().trim().optional(),
  status,
  ctaLabel: optionalLinkLabel,
  ctaUrl: optionalLinkUrl,
});

export const gallerySchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug,
  description: z.string().trim().max(2000).optional(),
  status,
});

const optionalMediaId = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());
const optionalHttpUrl = z.string().trim().max(2000).optional().refine((value) => !value || /^https?:\/\//.test(value), "Use a full http(s) URL.");

export const repertoireSchema = z.object({
  title: z.string().trim().min(1).max(180),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  composer: z.string().trim().max(180).optional(),
  arranger: z.string().trim().max(180).optional(),
  instrumentation: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(6000).optional(),
  coverMediaId: optionalMediaId,
  youtubeUrl: optionalHttpUrl,
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
  ctaLabel: optionalLinkLabel,
  ctaUrl: optionalLinkUrl,
});
