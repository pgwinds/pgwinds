import { PageHero } from "@/components/shared/page-hero";

export const metadata = { title: "Contact" };
export default function ContactPage() { return <><PageHero label="Contact" title="Let’s make music happen." intro="For performance invitations, collaborations, and general enquiries, get in touch." /><section className="section"><div className="container contact-grid"><div><p className="eyebrow">Email</p><a className="contact-link" href="mailto:pgwinds@psu.ac.th">pgwinds@psu.ac.th</a></div><div><p className="eyebrow">Based in</p><p>Prince of Songkla University<br />Hat Yai, Songkhla, Thailand</p></div><div><p className="eyebrow">Follow along</p><p>Social channels will be connected here soon.</p></div></div></section></> }
