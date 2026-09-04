import Image from "next/image";
import { SocialLinks } from "@/components/public/social-links";
import { getPublicSocialLinks, getPublishedSiteSettings } from "@/lib/queries/website";
import { LocalizedHomeLink } from "./localized-home-link";

export async function Footer() { const [links, settings] = await Promise.all([getPublicSocialLinks(), getPublishedSiteSettings()]); return <footer className="site-footer"><div className="container site-footer__inner"><LocalizedHomeLink className="wordmark" ariaLabel={`${settings.content.general.siteName} home`}>{settings.media.logo ? <Image className="site-logo" src={settings.media.logo} alt={settings.content.general.siteName} width={220} height={76} /> : <>PG<span>WINDS</span></>}</LocalizedHomeLink><p>{settings.content.general.shortDescription}</p><SocialLinks links={links} /><p>© {new Date().getFullYear()} {settings.content.general.siteName}</p></div></footer>; }
