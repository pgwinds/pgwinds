-- Admin-management RPCs are deliberately database-side so no service-role key is
-- needed in the Next.js application. Only an existing administrator can call them.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users
    where id = auth.uid()
      and raw_app_meta_data ->> 'pgwinds_role' = 'admin'
  );
$$;

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
  select users.id, users.email, users.raw_app_meta_data ->> 'pgwinds_role', users.created_at, users.last_sign_in_at
  from auth.users as users
  where users.raw_app_meta_data ->> 'pgwinds_role' = 'admin'
  order by lower(users.email);
end;
$$;

create or replace function public.grant_pgwinds_admin_role(target_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
  normalized_email text := lower(trim(target_email));
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized to manage administrators.';
  end if;

  select id into target_id
  from auth.users
  where lower(email) = normalized_email;

  if target_id is null then
    raise exception 'No Supabase Authentication account exists for this email.';
  end if;

  update auth.users
  set raw_app_meta_data = jsonb_set(coalesce(raw_app_meta_data, '{}'::jsonb), '{pgwinds_role}', '"admin"'::jsonb, true),
      updated_at = now()
  where id = target_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'administrator.role_granted', 'administrator', target_id, jsonb_build_object('email', normalized_email, 'role', 'admin'));

  return target_id;
end;
$$;

create or replace function public.revoke_pgwinds_admin_role(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_email text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Not authorized to manage administrators.';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'You cannot remove your own administrator role.';
  end if;

  select email into target_email
  from auth.users
  where id = target_user_id
    and raw_app_meta_data ->> 'pgwinds_role' = 'admin';

  if target_email is null then
    raise exception 'This account is not an administrator.';
  end if;

  if (select count(*) from auth.users where raw_app_meta_data ->> 'pgwinds_role' = 'admin') <= 1 then
    raise exception 'At least one administrator must remain.';
  end if;

  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) - 'pgwinds_role',
      updated_at = now()
  where id = target_user_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'administrator.role_revoked', 'administrator', target_user_id, jsonb_build_object('email', target_email, 'role', 'admin'));
end;
$$;

revoke all on function public.list_pgwinds_admins() from public;
revoke all on function public.grant_pgwinds_admin_role(text) from public;
revoke all on function public.revoke_pgwinds_admin_role(uuid) from public;
grant execute on function public.list_pgwinds_admins() to authenticated;
grant execute on function public.grant_pgwinds_admin_role(text) to authenticated;
grant execute on function public.revoke_pgwinds_admin_role(uuid) to authenticated;
