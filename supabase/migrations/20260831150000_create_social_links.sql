create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (char_length(platform) between 1 and 80),
  label text,
  url text not null check (char_length(url) between 1 and 2000),
  visible boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index social_links_position_unique on public.social_links (position);
create trigger social_links_set_updated_at before update on public.social_links
for each row execute function public.set_updated_at();

alter table public.social_links enable row level security;
create policy "Public reads visible social links" on public.social_links
for select to anon, authenticated using (visible = true);
create policy "Admins manage social links" on public.social_links
for all to authenticated using (public.is_admin()) with check (public.is_admin());
