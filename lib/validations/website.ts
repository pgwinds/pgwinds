import { z } from "zod";

const optionalMediaId = z.preprocess((value) => value === "" ? undefined : value, z.string().uuid().optional());
const optionalLink = z.string().trim().max(2000).optional().refine((value) => !value || /^https?:\/\//.test(value) || (value.startsWith("/") && !value.startsWith("//")), "Use a full http(s) URL or a site path starting with /.");
const optionalLabel = z.string().trim().max(80).optional();
const nullableLink = optionalLink.nullable();
const nullableLabel = optionalLabel.nullable();
const checkbox = z.preprocess((value) => value === "on" || value === true, z.boolean());

export const homeContentSchema = z.object({
  hero: z.object({
    visible: z.boolean(), eyebrow: z.string().trim().max(140), title: z.string().trim().min(1).max(240), description: z.string().trim().max(1000),
    primaryLabel: nullableLabel, primaryUrl: nullableLink, secondaryLabel: nullableLabel, secondaryUrl: nullableLink,
    desktopMediaId: z.string().uuid().nullable(), mobileMediaId: z.string().uuid().nullable(), overlay: z.number().min(0).max(90), alignment: z.enum(["left", "center"]),
  }),
  featured: z.object({
    visible: z.boolean(), concertId: z.string().uuid().nullable(), eyebrow: z.string().trim().max(100), heading: z.string().trim().max(240), description: z.string().trim().max(1000),
    ctaLabel: nullableLabel, ctaUrl: nullableLink, backgroundMediaId: z.string().uuid().nullable(),
  }),
});

export type HomeContent = z.infer<typeof homeContentSchema>;

export const defaultHomeContent: HomeContent = {
  hero: { visible: true, eyebrow: "Princess Galyani Vadhana Institute of Music", title: "Where wind, rhythm and community meet.", description: "PGWINDS is the Princess Galyani Vadhana Institute of Music Wind Symphony: a place for musicians to grow, perform, and share the joy of music with the world.", primaryLabel: "Explore concerts", primaryUrl: "/concerts", secondaryLabel: "Meet PGWINDS", secondaryUrl: "/about", desktopMediaId: null, mobileMediaId: null, overlay: 40, alignment: "left" },
  featured: { visible: true, concertId: null, eyebrow: "Coming up", heading: "", description: "", ctaLabel: "View all concerts", ctaUrl: "/concerts", backgroundMediaId: null },
};

export const homeEditorSchema = z.object({
  heroVisible: checkbox, heroEyebrow: z.string().trim().max(140), heroTitle: z.string().trim().min(1).max(240), heroDescription: z.string().trim().max(1000),
  primaryLabel: optionalLabel, primaryUrl: optionalLink, secondaryLabel: optionalLabel, secondaryUrl: optionalLink,
  desktopMediaId: optionalMediaId, mobileMediaId: optionalMediaId, heroOverlay: z.coerce.number().min(0).max(90), heroAlignment: z.enum(["left", "center"]),
  featuredVisible: checkbox, featuredConcertId: optionalMediaId, featuredEyebrow: z.string().trim().max(100), featuredHeading: z.string().trim().max(240), featuredDescription: z.string().trim().max(1000),
  featuredCtaLabel: optionalLabel, featuredCtaUrl: optionalLink, featuredBackgroundMediaId: optionalMediaId,
});

export function toHomeContent(input: z.infer<typeof homeEditorSchema>): HomeContent {
  const primaryUrl = input.primaryUrl || null;
  const secondaryUrl = input.secondaryUrl || null;
  const featuredCtaUrl = input.featuredCtaUrl || null;
  return {
    hero: { visible: input.heroVisible, eyebrow: input.heroEyebrow, title: input.heroTitle, description: input.heroDescription, primaryLabel: primaryUrl ? input.primaryLabel || "Learn more" : null, primaryUrl, secondaryLabel: secondaryUrl ? input.secondaryLabel || "Learn more" : null, secondaryUrl, desktopMediaId: input.desktopMediaId ?? null, mobileMediaId: input.mobileMediaId ?? null, overlay: input.heroOverlay, alignment: input.heroAlignment },
    featured: { visible: input.featuredVisible, concertId: input.featuredConcertId ?? null, eyebrow: input.featuredEyebrow, heading: input.featuredHeading, description: input.featuredDescription, ctaLabel: featuredCtaUrl ? input.featuredCtaLabel || "Learn more" : null, ctaUrl: featuredCtaUrl, backgroundMediaId: input.featuredBackgroundMediaId ?? null },
  };
}

export const aboutContentSchema = z.object({
  hero: z.object({ title: z.string().trim().min(1).max(240), intro: z.string().trim().max(1000), mediaId: z.string().uuid().nullable(), overlay: z.number().min(0).max(90) }),
  history: z.object({ heading: z.string().trim().min(1).max(120), body: z.string().trim().max(6000) }),
  philosophy: z.object({ heading: z.string().trim().min(1).max(120), body: z.string().trim().max(6000) }),
  institute: z.object({ heading: z.string().trim().min(1).max(120), body: z.string().trim().max(6000) }),
});
export type AboutContent = z.infer<typeof aboutContentSchema>;
export const defaultAboutContent: AboutContent = { hero: { title: "More than an orchestra.", intro: "We are a community brought together by a shared belief in the power of music.", mediaId: null, overlay: 40 }, history: { heading: "Our story", body: "PGWINDS is the Princess Galyani Vadhana Institute of Music Wind Symphony, the wind symphony of Princess Galyani Vadhana Institute of Music. We create opportunities for musicians to learn, perform, and connect through music." }, philosophy: { heading: "Our purpose", body: "From rehearsal rooms to concert stages, we nurture musical craft, generosity, and a lasting sense of belonging." }, institute: { heading: "Our institute", body: "Princess Galyani Vadhana Institute of Music is a place for artistic learning, collaboration, and musical discovery." } };
export const aboutEditorSchema = z.object({ heroTitle: z.string().trim().min(1).max(240), heroIntro: z.string().trim().max(1000), heroMediaId: optionalMediaId, heroOverlay: z.coerce.number().min(0).max(90), historyHeading: z.string().trim().min(1).max(120), historyBody: z.string().trim().max(6000), philosophyHeading: z.string().trim().min(1).max(120), philosophyBody: z.string().trim().max(6000), instituteHeading: z.string().trim().min(1).max(120), instituteBody: z.string().trim().max(6000) });
export function toAboutContent(input: z.infer<typeof aboutEditorSchema>): AboutContent { return { hero: { title: input.heroTitle, intro: input.heroIntro, mediaId: input.heroMediaId ?? null, overlay: input.heroOverlay }, history: { heading: input.historyHeading, body: input.historyBody }, philosophy: { heading: input.philosophyHeading, body: input.philosophyBody }, institute: { heading: input.instituteHeading, body: input.instituteBody } }; }

export const contactContentSchema = z.object({ hero: z.object({ title: z.string().trim().min(1).max(240), intro: z.string().trim().max(1000) }), email: z.string().trim().email().nullable(), phone: z.string().trim().max(80).nullable(), address: z.string().trim().max(1000).nullable() });
export type ContactContent = z.infer<typeof contactContentSchema>;
export const defaultContactContent: ContactContent = { hero: { title: "Let’s make music happen.", intro: "For performance invitations, collaborations, and general enquiries, get in touch." }, email: null, phone: null, address: "Princess Galyani Vadhana Institute of Music\nThailand" };
export const contactEditorSchema = z.object({ heroTitle: z.string().trim().min(1).max(240), heroIntro: z.string().trim().max(1000), email: z.preprocess((value) => value === "" ? null : value, z.string().trim().email().nullable()), phone: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(80).nullable()), address: z.preprocess((value) => value === "" ? null : value, z.string().trim().max(1000).nullable()) });
export function toContactContent(input: z.infer<typeof contactEditorSchema>): ContactContent { return { hero: { title: input.heroTitle, intro: input.heroIntro }, email: input.email, phone: input.phone, address: input.address }; }

export const socialLinkSchema = z.object({ platform: z.string().trim().min(1).max(80), label: z.string().trim().max(80).optional(), url: z.string().trim().max(2000).refine((value) => /^https?:\/\//.test(value), "Use a full http(s) URL."), visible: checkbox, position: z.coerce.number().int().min(0).max(9999) });

export const navigationItemSchema = z.object({ itemKey: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."), label: z.string().trim().min(1).max(80), href: z.string().trim().max(2000).refine((value) => /^https?:\/\//.test(value) || (value.startsWith("/") && !value.startsWith("//")), "Use a full http(s) URL or a site path starting with /."), groupName: z.enum(["main", "more"]), visible: checkbox, position: z.coerce.number().int().min(0).max(9999) });

export const siteSettingsContentSchema = z.object({
  general: z.object({ siteName: z.string().trim().min(1).max(100), shortDescription: z.string().trim().max(300), logoMediaId: z.string().uuid().nullable(), faviconMediaId: z.string().uuid().nullable() }),
  seo: z.object({ defaultTitle: z.string().trim().min(1).max(180), metaDescription: z.string().trim().min(1).max(300), ogImageMediaId: z.string().uuid().nullable() }),
});

export type SiteSettingsContent = z.infer<typeof siteSettingsContentSchema>;

export const defaultSiteSettings: SiteSettingsContent = {
  general: { siteName: "PGWINDS", shortDescription: "Princess Galyani Vadhana Institute of Music Wind Symphony", logoMediaId: null, faviconMediaId: null },
  seo: { defaultTitle: "PGWINDS | Princess Galyani Vadhana Institute of Music Wind Symphony", metaDescription: "Princess Galyani Vadhana Institute of Music Wind Symphony — music, community, and performance.", ogImageMediaId: null },
};

export const siteSettingsEditorSchema = z.object({
  siteName: z.string().trim().min(1).max(100), shortDescription: z.string().trim().max(300), logoMediaId: optionalMediaId, faviconMediaId: optionalMediaId,
  defaultTitle: z.string().trim().min(1).max(180), metaDescription: z.string().trim().min(1).max(300), ogImageMediaId: optionalMediaId,
});

export function toSiteSettingsContent(input: z.infer<typeof siteSettingsEditorSchema>): SiteSettingsContent {
  return { general: { siteName: input.siteName, shortDescription: input.shortDescription, logoMediaId: input.logoMediaId ?? null, faviconMediaId: input.faviconMediaId ?? null }, seo: { defaultTitle: input.defaultTitle, metaDescription: input.metaDescription, ogImageMediaId: input.ogImageMediaId ?? null } };
}
