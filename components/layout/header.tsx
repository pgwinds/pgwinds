import Image from "next/image";
import { getPublishedSiteSettings } from "@/lib/queries/website";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedHomeLink } from "./localized-home-link";
import { Navigation } from "./navigation";

export async function Header() {
  const { content, media } = await getPublishedSiteSettings();
  return <header className="site-header"><div className="container site-header__inner"><LocalizedHomeLink className="wordmark" ariaLabel={`${content.general.siteName} home`}>{media.logo ? <Image className="site-logo" src={media.logo} alt={content.general.siteName} width={220} height={76} priority /> : <>PG<span>WINDS</span></>}</LocalizedHomeLink><div className="site-header__actions"><Navigation /><LanguageSwitcher /></div></div></header>;
}
