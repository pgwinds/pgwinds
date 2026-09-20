-- Content lists are curated by administrators.  Position is intentionally not
-- unique: temporary duplicate values let a whole list be saved safely in one
-- transaction-like batch without a visible intermediate order.
alter table public.concerts add column if not exists position integer not null default 0 check (position >= 0);
alter table public.galleries add column if not exists position integer not null default 0 check (position >= 0);
alter table public.news add column if not exists position integer not null default 0 check (position >= 0);
alter table public.events add column if not exists position integer not null default 0 check (position >= 0);
alter table public.artists add column if not exists position integer not null default 0 check (position >= 0);
alter table public.repertoire add column if not exists position integer not null default 0 check (position >= 0);
alter table public.members add column if not exists position integer not null default 0 check (position >= 0);
alter table public.alumni add column if not exists position integer not null default 0 check (position >= 0);

-- Preserve each page's existing display order before administrators begin
-- controlling it manually.
with ranked as (
  select id, row_number() over (order by starts_at asc nulls last, created_at desc) * 10 as next_position
  from public.concerts
)
update public.concerts as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by published_at desc nulls last, created_at desc) * 10 as next_position
  from public.galleries
)
update public.galleries as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by published_at desc nulls last, created_at desc) * 10 as next_position
  from public.news
)
update public.news as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by starts_at asc nulls last, created_at desc) * 10 as next_position
  from public.events
)
update public.events as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by created_at desc) * 10 as next_position
  from public.artists
)
update public.artists as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by published_at desc nulls last, created_at desc) * 10 as next_position
  from public.repertoire
)
update public.repertoire as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by created_at desc) * 10 as next_position
  from public.members
)
update public.members as target set position = ranked.next_position from ranked where target.id = ranked.id;

with ranked as (
  select id, row_number() over (order by created_at desc) * 10 as next_position
  from public.alumni
)
update public.alumni as target set position = ranked.next_position from ranked where target.id = ranked.id;

create index if not exists concerts_public_position_idx on public.concerts (position) where status = 'published';
create index if not exists galleries_public_position_idx on public.galleries (position) where status = 'published';
create index if not exists news_public_position_idx on public.news (position) where status = 'published';
create index if not exists events_public_position_idx on public.events (position) where status = 'published';
create index if not exists artists_public_position_idx on public.artists (position) where status = 'published';
create index if not exists repertoire_public_position_idx on public.repertoire (position) where status = 'published';
create index if not exists members_public_position_idx on public.members (position) where status = 'published';
create index if not exists alumni_public_position_idx on public.alumni (position) where status = 'published';
