import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://pgwinds.vercel.app"),
  title: { default: "PGWINDS | Prince of Songkla University Wind Orchestra", template: "%s | PGWINDS" },
  description: "Prince of Songkla University Wind Orchestra — music, community, and performance.",
  openGraph: { type: "website", siteName: "PGWINDS", title: "PGWINDS | Prince of Songkla University Wind Orchestra", description: "Music, community, and performance." },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
