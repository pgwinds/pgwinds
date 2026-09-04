alter table public.repertoire
  add column slug text unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  add column cover_media_id uuid references public.media_assets(id) on delete set null,
  add column youtube_url text,
  add column published_at timestamptz;

update public.repertoire
set published_at = now()
where status = 'published' and published_at is null;

drop policy "Public reads active repertoire" on public.repertoire;
create policy "Public reads published repertoire" on public.repertoire
for select to anon, authenticated using (status = 'published' and published_at <= now());
