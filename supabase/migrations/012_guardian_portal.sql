-- Minimal guardian portal: tenant-scoped relationships, report history, access logs,
-- and optional authenticated guardian memberships. Existing public links remain valid.

alter table public.memberships drop constraint if exists memberships_role_check;
alter table public.memberships add constraint memberships_role_check
check (role in ('OWNER', 'TEACHER', 'STUDENT', 'GUARDIAN'));

create unique index if not exists memberships_guardian_user_org_unique
on public.memberships(user_id, organization_id) where role = 'GUARDIAN' and status = 'ACTIVE';

create table if not exists public.guardians (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text,
  email text,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guardians_name_length check (char_length(trim(name)) between 1 and 80),
  constraint guardians_phone_length check (char_length(coalesce(phone, '')) <= 30),
  constraint guardians_email_length check (char_length(coalesce(email, '')) <= 254)
);

create table if not exists public.student_guardians (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  guardian_id text not null references public.guardians(id) on delete cascade,
  relationship text not null check (relationship in ('어머니', '아버지', '조부모', '보호자', '기타')),
  is_primary boolean not null default false,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_at timestamptz not null default now(),
  unique (organization_id, student_id, guardian_id)
);

alter table public.public_report_tokens add column if not exists guardian_id text references public.guardians(id) on delete set null;

create table if not exists public.guardian_report_access_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  guardian_id text references public.guardians(id) on delete set null,
  report_id text not null references public.reports(id) on delete cascade,
  public_report_token_id uuid references public.public_report_tokens(id) on delete set null,
  viewed_at timestamptz not null default now(),
  ip_hash text,
  user_agent_summary text
);

create index if not exists guardians_organization_id_idx on public.guardians(organization_id);
create index if not exists guardians_auth_user_id_idx on public.guardians(auth_user_id);
create unique index if not exists guardians_org_email_unique on public.guardians(organization_id, lower(email)) where email is not null;
create index if not exists student_guardians_student_idx on public.student_guardians(organization_id, student_id) where status = 'ACTIVE';
create index if not exists student_guardians_guardian_idx on public.student_guardians(guardian_id) where status = 'ACTIVE';
create index if not exists guardian_access_report_idx on public.guardian_report_access_logs(report_id, viewed_at desc);

create or replace function public.is_guardian_for_student(target_org text, target_student text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.guardians g
    join public.student_guardians sg on sg.guardian_id = g.id
    where g.organization_id = target_org
      and g.auth_user_id = auth.uid()
      and sg.organization_id = target_org
      and sg.student_id = target_student
      and sg.status = 'ACTIVE'
  )
$$;

create or replace function public.current_guardian_id(target_org text)
returns text language sql stable security definer set search_path = public as $$
  select id from public.guardians where organization_id = target_org and auth_user_id = auth.uid() order by created_at limit 1
$$;

alter table public.guardians enable row level security;
alter table public.student_guardians enable row level security;
alter table public.guardian_report_access_logs enable row level security;

drop policy if exists guardians_select_scope on public.guardians;
create policy guardians_select_scope on public.guardians for select to authenticated
using (public.is_org_facilitator(organization_id) or auth_user_id = auth.uid());
drop policy if exists guardians_update_self_notifications on public.guardians;
create policy guardians_update_self_notifications on public.guardians for update to authenticated
using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());

drop policy if exists student_guardians_select_scope on public.student_guardians;
create policy student_guardians_select_scope on public.student_guardians for select to authenticated
using (
  public.is_org_facilitator(organization_id)
  or guardian_id = public.current_guardian_id(organization_id)
);

drop policy if exists reports_facilitator_only on public.reports;
drop policy if exists reports_select_scope on public.reports;
create policy reports_select_scope on public.reports for select to authenticated
using (public.is_org_facilitator(organization_id) or public.is_guardian_for_student(organization_id, student_id));
drop policy if exists reports_write_facilitator on public.reports;
create policy reports_write_facilitator on public.reports for all to authenticated
using (public.is_org_facilitator(organization_id)) with check (public.is_org_facilitator(organization_id));

drop policy if exists public_report_tokens_facilitator_select on public.public_report_tokens;
create policy public_report_tokens_facilitator_select on public.public_report_tokens for select to authenticated
using (exists (
  select 1 from public.reports r where r.id = report_id and public.is_org_facilitator(r.organization_id)
));

drop policy if exists guardian_access_select_scope on public.guardian_report_access_logs;
create policy guardian_access_select_scope on public.guardian_report_access_logs for select to authenticated
using (
  public.is_org_facilitator(organization_id)
  or guardian_id = public.current_guardian_id(organization_id)
);

-- Guardians must not inherit broad organization access to profiles or groups.
drop policy if exists users_select_scope on public.users;
create policy users_select_scope on public.users for select to authenticated
using (
  id = public.current_app_user_id()
  or exists (
    select 1 from public.memberships mine
    join public.memberships target on target.organization_id = mine.organization_id
    where mine.user_id = public.current_app_user_id()
      and mine.role in ('OWNER', 'TEACHER') and mine.status = 'ACTIVE'
      and target.user_id = users.id and target.status = 'ACTIVE'
  )
  or exists (
    select 1 from public.guardians g
    join public.student_guardians sg on sg.guardian_id = g.id
    where g.auth_user_id = auth.uid() and sg.student_id = users.id and sg.status = 'ACTIVE'
  )
);

drop policy if exists groups_select_member on public.performer_groups;
drop policy if exists groups_select_scope on public.performer_groups;
create policy groups_select_scope on public.performer_groups for select to authenticated
using (
  public.is_org_facilitator(organization_id)
  or exists (select 1 from public.memberships m where m.user_id = public.current_app_user_id() and m.group_id = performer_groups.id and m.status = 'ACTIVE')
  or exists (
    select 1 from public.guardians g
    join public.student_guardians sg on sg.guardian_id = g.id and sg.status = 'ACTIVE'
    join public.users student on student.id = sg.student_id
    where g.auth_user_id = auth.uid() and sg.organization_id = performer_groups.organization_id and student.group_id = performer_groups.id
  )
);

drop policy if exists missions_select_member on public.missions;
drop policy if exists missions_select_scope on public.missions;
create policy missions_select_scope on public.missions for select to authenticated
using (public.is_org_facilitator(organization_id) or assignee_id = public.current_app_user_id());

revoke all on public.guardians from anon, authenticated;
revoke all on public.student_guardians from anon, authenticated;
revoke all on public.guardian_report_access_logs from anon, authenticated;
grant select on public.guardians, public.student_guardians, public.guardian_report_access_logs to authenticated;
grant update (notifications_enabled, updated_at) on public.guardians to authenticated;
grant select on public.reports, public.public_report_tokens to authenticated;

create or replace function public.upsert_student_guardian(
  target_org text, target_student text, target_guardian text, guardian_name text,
  guardian_relationship text, guardian_phone text default null, guardian_email text default null,
  primary_guardian boolean default false
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  guardian_key text := coalesce(nullif(target_guardian, ''), 'guardian-' || gen_random_uuid()::text);
  linked_auth uuid;
  link_key text;
  result jsonb;
begin
  if not public.is_org_facilitator(target_org) then raise exception 'GUARDIAN_FORBIDDEN'; end if;
  if not exists (select 1 from public.memberships where organization_id = target_org and user_id = target_student and role = 'STUDENT' and status = 'ACTIVE') then raise exception 'STUDENT_OUTSIDE_ORG'; end if;
  if guardian_relationship not in ('어머니', '아버지', '조부모', '보호자', '기타') then raise exception 'INVALID_RELATIONSHIP'; end if;
  if nullif(trim(guardian_email), '') is not null then
    select auth_user_id into linked_auth from public.users where lower(email) = lower(trim(guardian_email)) and auth_user_id is not null limit 1;
    if target_guardian is null then
      select id into guardian_key from public.guardians where organization_id = target_org and lower(email) = lower(trim(guardian_email)) limit 1;
      guardian_key := coalesce(guardian_key, 'guardian-' || gen_random_uuid()::text);
    end if;
  end if;
  insert into public.guardians(id, organization_id, auth_user_id, name, phone, email)
  values(guardian_key, target_org, linked_auth, trim(guardian_name), nullif(trim(guardian_phone), ''), nullif(lower(trim(guardian_email)), ''))
  on conflict(id) do update set name = excluded.name, phone = excluded.phone, email = excluded.email,
    auth_user_id = coalesce(public.guardians.auth_user_id, excluded.auth_user_id), updated_at = now();
  if primary_guardian then
    update public.student_guardians set is_primary = false where organization_id = target_org and student_id = target_student and status = 'ACTIVE';
  end if;
  select id into link_key from public.student_guardians where organization_id = target_org and student_id = target_student and guardian_id = guardian_key;
  link_key := coalesce(link_key, 'student-guardian-' || gen_random_uuid()::text);
  insert into public.student_guardians(id, organization_id, student_id, guardian_id, relationship, is_primary, status)
  values(link_key, target_org, target_student, guardian_key, guardian_relationship, primary_guardian, 'ACTIVE')
  on conflict(organization_id, student_id, guardian_id) do update set relationship = excluded.relationship, is_primary = excluded.is_primary, status = 'ACTIVE';
  if linked_auth is not null then
    insert into public.memberships(id, user_id, organization_id, role, status)
    select 'membership-guardian-' || gen_random_uuid()::text, u.id, target_org, 'GUARDIAN', 'ACTIVE'
    from public.users u where u.auth_user_id = linked_auth
    on conflict do nothing;
  end if;
  select jsonb_build_object('guardian', to_jsonb(g), 'link', to_jsonb(sg)) into result
  from public.guardians g join public.student_guardians sg on sg.guardian_id = g.id
  where g.id = guardian_key and sg.id = link_key;
  return result;
end;
$$;

create or replace function public.unlink_student_guardian(target_org text, target_student text, target_guardian text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_org_facilitator(target_org) then raise exception 'GUARDIAN_FORBIDDEN'; end if;
  update public.student_guardians set status = 'INACTIVE', is_primary = false
  where organization_id = target_org and student_id = target_student and guardian_id = target_guardian;
end;
$$;

create or replace function public.create_guardian_report(
  report_id text, target_org text, target_student text, target_guardian text,
  report_snapshot jsonb, valid_days int default 7
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  app_user text := public.current_app_user_id();
  raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
  token_id uuid;
begin
  if not public.is_org_facilitator(target_org) then raise exception 'REPORT_FORBIDDEN'; end if;
  if not exists (select 1 from public.memberships where organization_id = target_org and user_id = target_student and role = 'STUDENT' and status = 'ACTIVE') then raise exception 'STUDENT_OUTSIDE_ORG'; end if;
  if target_guardian is not null and not exists (
    select 1 from public.student_guardians where organization_id = target_org and student_id = target_student and guardian_id = target_guardian and status = 'ACTIVE'
  ) then raise exception 'GUARDIAN_NOT_LINKED'; end if;
  insert into public.reports(id, organization_id, student_id, created_by, snapshot)
  values(report_id, target_org, target_student, app_user, report_snapshot);
  insert into public.public_report_tokens(report_id, guardian_id, token_hash, expires_at, created_by)
  values(report_id, target_guardian, encode(extensions.digest(raw_token, 'sha256'), 'hex'), now() + make_interval(days => greatest(1, least(valid_days, 30))), app_user)
  returning id into token_id;
  return jsonb_build_object('raw_token', raw_token, 'token_id', token_id, 'report_id', report_id);
end;
$$;

create or replace function public.revoke_public_report_token(target_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.public_report_tokens t set revoked_at = now()
  where t.id = target_token and exists (select 1 from public.reports r where r.id = t.report_id and public.is_org_facilitator(r.organization_id));
end;
$$;

create or replace function public.mark_guardian_report_viewed(target_report text)
returns void language plpgsql security definer set search_path = public as $$
declare target public.reports; guardian_key text;
begin
  select * into target from public.reports where id = target_report;
  if target.id is null or not public.is_guardian_for_student(target.organization_id, target.student_id) then raise exception 'REPORT_FORBIDDEN'; end if;
  guardian_key := public.current_guardian_id(target.organization_id);
  insert into public.guardian_report_access_logs(organization_id, guardian_id, report_id)
  values(target.organization_id, guardian_key, target.id);
end;
$$;

create or replace function public.get_public_report(raw_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare token_row public.public_report_tokens; report_row public.reports; headers jsonb; request_ip text; request_agent text;
begin
  select * into token_row from public.public_report_tokens t
  where t.token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex') and t.revoked_at is null and t.expires_at > now() limit 1;
  if token_row.id is null then return null; end if;
  select * into report_row from public.reports where id = token_row.report_id;
  headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  request_ip := coalesce(headers->>'x-forwarded-for', headers->>'cf-connecting-ip', '');
  request_agent := left(coalesce(headers->>'user-agent', ''), 160);
  insert into public.guardian_report_access_logs(organization_id, guardian_id, report_id, public_report_token_id, ip_hash, user_agent_summary)
  values(report_row.organization_id, token_row.guardian_id, report_row.id, token_row.id,
    case when request_ip = '' then null else encode(extensions.digest(request_ip || token_row.token_hash, 'sha256'), 'hex') end,
    nullif(request_agent, ''));
  return report_row.snapshot;
end;
$$;

-- Link a pre-created guardian record when its email account signs up later.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  provider_name text := upper(coalesce(new.raw_app_meta_data->>'provider', 'EMAIL'));
  profile_name text;
  avatar_url text;
begin
  if provider_name not in ('EMAIL', 'GOOGLE', 'KAKAO') then provider_name := 'EMAIL'; end if;
  profile_name := coalesce(
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    split_part(coalesce(new.email, '사용자'), '@', 1)
  );
  avatar_url := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');
  insert into public.users (
    id, auth_user_id, name, role, point, avatar, email,
    social_provider, social_id, profile_image, created_at
  ) values (
    new.id::text, new.id, profile_name, 'TEACHER', 0, left(profile_name, 1), new.email,
    provider_name, new.id::text, avatar_url, now()
  )
  on conflict (id) do update set
    auth_user_id = excluded.auth_user_id,
    email = coalesce(excluded.email, public.users.email),
    social_provider = excluded.social_provider,
    profile_image = coalesce(excluded.profile_image, public.users.profile_image);
  update public.guardians set auth_user_id = new.id, updated_at = now()
  where auth_user_id is null and new.email is not null and lower(email) = lower(new.email);
  insert into public.memberships(id, user_id, organization_id, role, status)
  select 'membership-guardian-' || gen_random_uuid()::text, new.id::text, g.organization_id, 'GUARDIAN', 'ACTIVE'
  from public.guardians g where g.auth_user_id = new.id
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.upsert_student_guardian(text,text,text,text,text,text,text,boolean) from public;
revoke all on function public.unlink_student_guardian(text,text,text) from public;
revoke all on function public.create_guardian_report(text,text,text,text,jsonb,int) from public;
revoke all on function public.revoke_public_report_token(uuid) from public;
revoke all on function public.mark_guardian_report_viewed(text) from public;
grant execute on function public.upsert_student_guardian(text,text,text,text,text,text,text,boolean) to authenticated;
grant execute on function public.unlink_student_guardian(text,text,text) to authenticated;
grant execute on function public.create_guardian_report(text,text,text,text,jsonb,int) to authenticated;
grant execute on function public.revoke_public_report_token(uuid) to authenticated;
grant execute on function public.mark_guardian_report_viewed(text) to authenticated;
grant execute on function public.get_public_report(text) to anon, authenticated;
notify pgrst, 'reload schema';
