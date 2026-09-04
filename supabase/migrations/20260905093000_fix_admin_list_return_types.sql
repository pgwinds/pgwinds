-- auth.users.email is varchar while the RPC contract exposes text.
-- Cast it explicitly so PostgreSQL can validate the function's return shape.

create or replace function public.list_pgwinds_admins()
returns table (
  id uuid,
  email text,
  admin_role text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized to manage administrators.';
  end if;

  return query
  select users.id, users.email::text, users.raw_app_meta_data ->> 'pgwinds_role', users.created_at, users.last_sign_in_at
  from auth.users as users
  where users.raw_app_meta_data ->> 'pgwinds_role' = 'admin'
  order by lower(users.email);
end;
$$;
