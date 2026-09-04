import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { ContentCta } from "@/components/public/content-cta";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isSupabaseConfigured) notFound();
  const supabase = await createClient();
  const { data } = await supabase.from("news").select("title,body,published_at,cta_label,cta_url").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) notFound();
  return <article className="section"><div className="container prose"><p className="eyebrow">{data.published_at ? new Date(data.published_at).toLocaleDateString("en-GB") : "News"}</p><h1>{data.title}</h1><p>{data.body}</p><ContentCta label={data.cta_label} url={data.cta_url} /></div></article>;
}
