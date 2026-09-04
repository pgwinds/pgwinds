import { ContactContentView } from "@/components/public/contact-content";
import { getPublicSocialLinks, getPublishedContactContent } from "@/lib/queries/website";

export const metadata = { title: "Contact" };
export default async function ContactPage() { const [content, links] = await Promise.all([getPublishedContactContent(), getPublicSocialLinks()]); return <ContactContentView content={content} links={links} />; }
