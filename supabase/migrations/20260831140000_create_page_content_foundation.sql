create table public.page_content (
  page_key text primary key check (page_key ~ '^[a-z0-9-]+$'),
  content jsonb not null default '{}'::jsonb,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.page_content_drafts (
  page_key text primary key check (page_key ~ '^[a-z0-9-]+$'),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger page_content_set_updated_at before update on public.page_content
for each row execute function public.set_updated_at();

create trigger page_content_drafts_set_updated_at before update on public.page_content_drafts
for each row execute function public.set_updated_at();

alter table public.page_content enable row level security;
alter table public.page_content_drafts enable row level security;

create policy "Public reads published page content" on public.page_content
for select to anon, authenticated using (true);

create policy "Admins manage published page content" on public.page_content
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage page drafts" on public.page_content_drafts
for all to authenticated using (public.is_admin()) with check (public.is_admin());
