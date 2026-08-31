create table public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  excerpt text not null default '',
  body text not null default '',
  cover_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null default '',
  venue text,
  starts_at timestamptz,
  ends_at timestamptz,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  biography text not null default '',
  portrait_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.repertoire (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  composer text,
  arranger text,
  instrumentation text,
  notes text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_artists (
  event_id uuid not null references public.events(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  role_label text,
  position integer not null default 0 check (position >= 0),
  primary key (event_id, artist_id)
);

create table public.event_repertoire (
  event_id uuid not null references public.events(id) on delete cascade,
  repertoire_id uuid not null references public.repertoire(id) on delete restrict,
  position integer not null default 0 check (position >= 0),
  primary key (event_id, repertoire_id)
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  instrument text,
  biography text,
  portrait_media_id uuid references public.media_assets(id) on delete set null,
  joined_on date,
  left_on date,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (left_on is null or joined_on is null or left_on >= joined_on)
);

create table public.alumni (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  instrument text,
  graduation_year integer check (graduation_year between 1900 and 2100),
  biography text,
  portrait_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_public_listing_idx on public.news (published_at desc) where status = 'published';
create index events_public_listing_idx on public.events (starts_at) where status = 'published';
create index artists_public_listing_idx on public.artists (published_at desc) where status = 'published';

create trigger news_set_updated_at before update on public.news for each row execute function public.set_updated_at();
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();
create trigger artists_set_updated_at before update on public.artists for each row execute function public.set_updated_at();
create trigger repertoire_set_updated_at before update on public.repertoire for each row execute function public.set_updated_at();
create trigger members_set_updated_at before update on public.members for each row execute function public.set_updated_at();
create trigger alumni_set_updated_at before update on public.alumni for each row execute function public.set_updated_at();

alter table public.news enable row level security;
alter table public.events enable row level security;
alter table public.artists enable row level security;
alter table public.repertoire enable row level security;
alter table public.event_artists enable row level security;
alter table public.event_repertoire enable row level security;
alter table public.members enable row level security;
alter table public.alumni enable row level security;

create policy "Public reads published news" on public.news for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "Admins manage news" on public.news for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published events" on public.events for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "Admins manage events" on public.events for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published artists" on public.artists for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy "Admins manage artists" on public.artists for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads active repertoire" on public.repertoire for select to anon, authenticated using (status = 'published');
create policy "Admins manage repertoire" on public.repertoire for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads event artists" on public.event_artists for select to anon, authenticated using (exists (select 1 from public.events where events.id = event_artists.event_id and events.status = 'published' and events.published_at <= now()));
create policy "Admins manage event artists" on public.event_artists for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads event repertoire" on public.event_repertoire for select to anon, authenticated using (exists (select 1 from public.events where events.id = event_repertoire.event_id and events.status = 'published' and events.published_at <= now()));
create policy "Admins manage event repertoire" on public.event_repertoire for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads current members" on public.members for select to anon, authenticated using (status = 'published');
create policy "Admins manage members" on public.members for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads published alumni" on public.alumni for select to anon, authenticated using (status = 'published');
create policy "Admins manage alumni" on public.alumni for all to authenticated using (public.is_admin()) with check (public.is_admin());
