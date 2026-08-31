create extension if not exists "pgcrypto";

create type public.content_status as enum ('draft', 'published', 'archived');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null default 'public-media',
  object_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer check (width > 0),
  height integer check (height > 0),
  alt_text text not null default '',
  caption text,
  credit text,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.concerts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  venue text not null default '',
  display_date text not null default '',
  starts_at timestamptz,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (gallery_id, media_asset_id),
  unique (gallery_id, position)
);

create index concerts_public_listing_idx on public.concerts (status, starts_at) where status = 'published';
create index galleries_public_listing_idx on public.galleries (status, published_at desc) where status = 'published';
create index gallery_items_gallery_position_idx on public.gallery_items (gallery_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger media_assets_set_updated_at before update on public.media_assets
for each row execute function public.set_updated_at();
create trigger concerts_set_updated_at before update on public.concerts
for each row execute function public.set_updated_at();
create trigger galleries_set_updated_at before update on public.galleries
for each row execute function public.set_updated_at();

-- Phase 3 sets this custom claim using server-only administrative code.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'pgwinds_role') = 'admin', false);
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.media_assets enable row level security;
alter table public.concerts enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_items enable row level security;

create policy "Public can view published concerts" on public.concerts
for select to anon, authenticated
using (status = 'published' and published_at <= now());
create policy "Admins manage concerts" on public.concerts
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Public can view published galleries" on public.galleries
for select to anon, authenticated
using (status = 'published' and published_at <= now());
create policy "Admins manage galleries" on public.galleries
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Public can view items in published galleries" on public.gallery_items
for select to anon, authenticated
using (
  exists (
    select 1 from public.galleries
    where galleries.id = gallery_items.gallery_id
      and galleries.status = 'published'
      and galleries.published_at <= now()
  )
);
create policy "Admins manage gallery items" on public.gallery_items
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy "Public can view public media metadata" on public.media_assets
for select to anon, authenticated
using (is_public = true);
create policy "Admins manage media metadata" on public.media_assets
for all to authenticated
using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

create policy "Public can read public media" on storage.objects
for select to public
using (bucket_id = 'public-media');
create policy "Admins manage public media" on storage.objects
for all to authenticated
using (bucket_id = 'public-media' and public.is_admin())
with check (bucket_id = 'public-media' and public.is_admin());
