import Link from "next/link";

export default function NotFound() { return <section className="page-hero"><div className="container"><p className="eyebrow">404</p><h1>This page is not in the programme.</h1><p>Return to the PGWINDS homepage to keep exploring.</p><Link className="button" href="/">Back home</Link></div></section>; }
