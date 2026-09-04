import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { getLocale } from "@/lib/i18n";
import { getPublishedSiteSettings } from "@/lib/queries/website";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { content, media } = await getPublishedSiteSettings();
  return { metadataBase: new URL("https://pgwinds.vercel.app"), title: { default: content.seo.defaultTitle, template: `%s | ${content.general.siteName}` }, description: content.seo.metaDescription, icons: media.favicon ? { icon: media.favicon } : undefined, openGraph: { type: "website", siteName: content.general.siteName, title: content.seo.defaultTitle, description: content.seo.metaDescription, images: media.ogImage ? [{ url: media.ogImage }] : undefined } };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
