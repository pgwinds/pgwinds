-- Keep an important part of an image visible when a responsive component crops it.
alter table public.media_assets
  add column if not exists focal_x integer not null default 50 check (focal_x between 0 and 100),
  add column if not exists focal_y integer not null default 50 check (focal_y between 0 and 100);
