import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ContentCta } from "@/components/public/content-cta";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("title,description,venue,starts_at,cta_label,cta_url").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) notFound();
  return <article className="section"><div className="container prose"><p className="eyebrow">{[data.starts_at ? new Date(data.starts_at).toLocaleDateString("en-GB") : "", data.venue].filter(Boolean).join(" · ")}</p><h1>{data.title}</h1><p>{data.description}</p><ContentCta label={data.cta_label} url={data.cta_url} /></div></article>;
}
