create type public.site_locale as enum ('en', 'th');

create table public.page_content_localizations (
  page_key text not null check (page_key ~ '^[a-z0-9-]+$'),
  locale public.site_locale not null,
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (page_key, locale)
);

create table public.page_content_localization_drafts (
  page_key text not null check (page_key ~ '^[a-z0-9-]+$'),
  locale public.site_locale not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (page_key, locale)
);

create table public.content_localizations (
  content_type text not null check (content_type ~ '^[a-z_]+$'),
  content_id uuid not null,
  locale public.site_locale not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id, locale)
);

create trigger page_content_localizations_set_updated_at before update on public.page_content_localizations for each row execute function public.set_updated_at();
create trigger page_content_localization_drafts_set_updated_at before update on public.page_content_localization_drafts for each row execute function public.set_updated_at();
create trigger content_localizations_set_updated_at before update on public.content_localizations for each row execute function public.set_updated_at();

alter table public.page_content_localizations enable row level security;
alter table public.page_content_localization_drafts enable row level security;
alter table public.content_localizations enable row level security;

create policy "Public reads page localizations" on public.page_content_localizations for select to anon, authenticated using (true);
create policy "Admins manage page localizations" on public.page_content_localizations for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage page localization drafts" on public.page_content_localization_drafts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage content localizations" on public.content_localizations for all to authenticated using (public.is_admin()) with check (public.is_admin());
