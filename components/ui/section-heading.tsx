type SectionHeadingProps = { label: string; title: string };
export function SectionHeading({ label, title }: SectionHeadingProps) { return <div className="section-heading"><p className="eyebrow">{label}</p><h2>{title}</h2></div>; }
