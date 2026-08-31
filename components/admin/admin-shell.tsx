import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

const links = [{ href: "/admin", label: "Overview" }, { href: "/admin/concerts", label: "Concerts" }, { href: "/admin/galleries", label: "Galleries" }, { href: "/admin/news", label: "News" }, { href: "/admin/events", label: "Events" }, { href: "/admin/artists", label: "Artists" }, { href: "/admin/repertoire", label: "Repertoire" }, { href: "/admin/members", label: "Members" }, { href: "/admin/alumni", label: "Alumni" }, { href: "/admin/media", label: "Media" }];

export function AdminShell({ children, email }: Readonly<{ children: React.ReactNode; email: string }>) {
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="wordmark" href="/admin">PG<span>WINDS</span><small>ADMIN</small></Link><nav aria-label="Admin navigation">{links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav><div className="admin-user"><span>{email}</span><form action={signOut}><button type="submit">Sign out</button></form></div></aside><main className="admin-main">{children}</main></div>;
}
