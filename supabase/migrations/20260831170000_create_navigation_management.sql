create type public.navigation_group as enum ('main', 'more');

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null unique check (item_key ~ '^[a-z0-9-]+$'),
  label text not null check (char_length(label) between 1 and 80),
  href text not null check (char_length(href) between 1 and 2000),
  group_name public.navigation_group not null default 'main',
  visible boolean not null default true,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index navigation_items_public_order_idx on public.navigation_items (group_name, position) where visible = true;
create trigger navigation_items_set_updated_at before update on public.navigation_items
for each row execute function public.set_updated_at();

alter table public.navigation_items enable row level security;
create policy "Public reads visible navigation" on public.navigation_items
for select to anon, authenticated using (visible = true);
create policy "Admins manage navigation" on public.navigation_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.navigation_items (item_key, label, href, group_name, visible, position) values
  ('about', 'About', '/about', 'main', true, 10),
  ('concerts', 'Concerts', '/concerts', 'main', true, 20),
  ('contact', 'Contact', '/contact', 'main', true, 30),
  ('gallery', 'Gallery', '/gallery', 'more', true, 10),
  ('artists', 'Artists', '/artists', 'more', true, 20),
  ('repertoire', 'Repertoire', '/repertoire', 'more', true, 30),
  ('news', 'News', '/news', 'more', false, 40),
  ('events', 'Events', '/events', 'more', false, 50)
on conflict (item_key) do nothing;
