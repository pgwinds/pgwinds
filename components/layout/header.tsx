import Link from "next/link";
import { Navigation } from "./navigation";

export function Header() { return <header className="site-header"><div className="container site-header__inner"><Link className="wordmark" href="/" aria-label="PGWINDS home">PG<span>WINDS</span></Link><Navigation /></div></header>; }
