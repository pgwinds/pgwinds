import type { MetadataRoute } from "next";

const routes = ["", "/about", "/concerts", "/gallery", "/contact", "/news", "/events", "/artists", "/repertoire", "/members", "/alumni", "/archive"];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({ url: `https://pgwinds.vercel.app${route}`, lastModified: new Date(), changeFrequency: "weekly", priority: route === "" ? 1 : 0.7 }));
}
