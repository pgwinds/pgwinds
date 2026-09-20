-- Private organization metadata for the public-media library.
-- Existing Storage objects and media_assets rows remain unchanged.

create table public.media_albums (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 120),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_album_items (
  album_id uuid not null references public.media_albums(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (album_id, media_asset_id)
);

create table public.media_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table public.media_asset_tags (
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  tag_id uuid not null references public.media_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (media_asset_id, tag_id)
);

create index media_album_items_asset_idx on public.media_album_items (media_asset_id);
create index media_asset_tags_asset_idx on public.media_asset_tags (media_asset_id);

create trigger media_albums_set_updated_at before update on public.media_albums
for each row execute function public.set_updated_at();

alter table public.media_albums enable row level security;
alter table public.media_album_items enable row level security;
alter table public.media_tags enable row level security;
alter table public.media_asset_tags enable row level security;

create policy "Admins manage media albums" on public.media_albums
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media album items" on public.media_album_items
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media tags" on public.media_tags
for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage media asset tags" on public.media_asset_tags
for all to authenticated using (public.is_admin()) with check (public.is_admin());
