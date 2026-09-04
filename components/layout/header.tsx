import Link from "next/link";
import Image from "next/image";
import { getAdminUser } from "@/lib/auth";
import { getPublishedSiteSettings } from "@/lib/queries/website";
import { LanguageSwitcher } from "./language-switcher";
import { LocalizedHomeLink } from "./localized-home-link";
import { Navigation } from "./navigation";

export async function Header() {
  const [admin, settings] = await Promise.all([getAdminUser(), getPublishedSiteSettings()]);
  return <header className="site-header"><div className="container site-header__inner"><LocalizedHomeLink className="wordmark" ariaLabel={`${settings.content.general.siteName} home`}>{settings.media.logo ? <Image className="site-logo" src={settings.media.logo} alt={settings.content.general.siteName} width={220} height={76} priority /> : <>PG<span>WINDS</span></>}</LocalizedHomeLink><div className="site-header__actions"><Navigation /><LanguageSwitcher />{admin && <Link className="admin-return-link" href="/admin">Back to Admin</Link>}</div></div></header>;
}
