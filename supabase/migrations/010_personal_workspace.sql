-- Secure self-service workspace creation for organization and personal TODO use.
-- This also repairs the auth/profile link for accounts created while the auth
-- trigger was temporarily unavailable, without weakening tenant RLS.

create or replace function public.create_workspace(
  org_id text,
  org_name text,
  invite_code text,
  organization_type text default 'EDUCATION'
)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  auth_user uuid := auth.uid();
  app_user text;
  result public.memberships;
  normalized_type text := upper(trim(organization_type));
  auth_email text := nullif(auth.jwt()->>'email', '');
  provider_name text := upper(coalesce(auth.jwt()->'app_metadata'->>'provider', 'EMAIL'));
begin
  if auth_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if normalized_type not in ('EDUCATION', 'PERSONAL') then raise exception 'INVALID_ORGANIZATION_TYPE'; end if;
  if nullif(trim(org_name), '') is null then raise exception 'ORGANIZATION_NAME_REQUIRED'; end if;

  select id into app_user from public.users where auth_user_id = auth_user limit 1;

  -- Safe recovery: bind only one unbound profile with the authenticated email.
  if app_user is null and auth_email is not null then
    select id into app_user
    from public.users
    where auth_user_id is null and lower(email) = lower(auth_email)
    order by created_at desc
    limit 1;
    if app_user is not null then
      update public.users set auth_user_id = auth_user where id = app_user and auth_user_id is null;
    end if;
  end if;

  if app_user is null then
    if provider_name not in ('EMAIL', 'GOOGLE', 'KAKAO') then provider_name := 'EMAIL'; end if;
    app_user := auth_user::text;
    insert into public.users(id, auth_user_id, name, role, point, avatar, email, social_provider, social_id, created_at)
    values (
      app_user, auth_user, split_part(coalesce(auth_email, '사용자'), '@', 1),
      'TEACHER', 0, '👤', auth_email, provider_name, auth_user::text, now()
    )
    on conflict (id) do update set auth_user_id = excluded.auth_user_id
    returning id into app_user;
  end if;

  insert into public.organizations(id, name, type, owner_user_id, invite_code)
  values (org_id, trim(org_name), normalized_type, app_user, upper(invite_code));
  insert into public.memberships(id, user_id, organization_id, role, status)
  values ('membership-' || gen_random_uuid()::text, app_user, org_id, 'OWNER', 'ACTIVE')
  returning * into result;
  return result;
end;
$$;

revoke all on function public.create_workspace(text,text,text,text) from public;
grant execute on function public.create_workspace(text,text,text,text) to authenticated;
