import Link from "next/link";
import { navigation } from "@/lib/constants";

export function Navigation() { return <nav aria-label="Main navigation"><ul className="navigation">{navigation.map((item) => <li key={item.href}><Link href={item.href}>{item.label}</Link></li>)}</ul></nav>; }
