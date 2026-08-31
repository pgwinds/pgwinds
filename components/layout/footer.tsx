import Link from "next/link";

export function Footer() { return <footer className="site-footer"><div className="container site-footer__inner"><Link className="wordmark" href="/">PG<span>WINDS</span></Link><p>Prince of Songkla University Wind Orchestra</p><p>© {new Date().getFullYear()} PGWINDS</p></div></footer>; }
