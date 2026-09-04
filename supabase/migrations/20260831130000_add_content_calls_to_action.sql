alter table public.concerts
  add column cta_label text,
  add column cta_url text,
  add constraint concerts_cta_pair check ((cta_label is null and cta_url is null) or (cta_label is not null and cta_url is not null));

alter table public.news
  add column cta_label text,
  add column cta_url text,
  add constraint news_cta_pair check ((cta_label is null and cta_url is null) or (cta_label is not null and cta_url is not null));

alter table public.events
  add column cta_label text,
  add column cta_url text,
  add constraint events_cta_pair check ((cta_label is null and cta_url is null) or (cta_label is not null and cta_url is not null));

alter table public.artists
  add column cta_label text,
  add column cta_url text,
  add constraint artists_cta_pair check ((cta_label is null and cta_url is null) or (cta_label is not null and cta_url is not null));
