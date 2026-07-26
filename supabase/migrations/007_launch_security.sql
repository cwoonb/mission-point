-- Launch security: Supabase Auth identity, organization isolation, atomic workflows,
-- and expiring public report links. Additive only; no operational rows are deleted.

create extension if not exists pgcrypto;

alter table public.users add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.users add column if not exists status_thresholds jsonb;
create index if not exists users_auth_user_id_idx on public.users(auth_user_id);

alter table public.performer_groups add column if not exists organization_id text references public.organizations(id) on delete cascade;
alter table public.mission_submissions add column if not exists organization_id text references public.organizations(id) on delete cascade;
alter table public.mission_review_logs add column if not exists organization_id text references public.organizations(id) on delete cascade;
alter table public.teacher_notes add column if not exists organization_id text references public.organizations(id) on delete cascade;
alter table public.teacher_notes add column if not exists author_id text references public.users(id) on delete cascade;

create index if not exists performer_groups_organization_id_idx on public.performer_groups(organization_id);
create index if not exists mission_submissions_organization_id_idx on public.mission_submissions(organization_id);
create index if not exists mission_review_logs_organization_id_idx on public.mission_review_logs(organization_id);
create index if not exists teacher_notes_organization_id_idx on public.teacher_notes(organization_id);

create table if not exists public.reports (
  id text primary key,
  organization_id text not null references public.organizations(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  created_by text not null references public.users(id) on delete cascade,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.public_report_tokens (
  id uuid primary key default gen_random_uuid(),
  report_id text not null references public.reports(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists reports_organization_id_idx on public.reports(organization_id);
create index if not exists reports_student_id_idx on public.reports(student_id);
create index if not exists public_report_tokens_report_id_idx on public.public_report_tokens(report_id);

-- Connect existing email profiles where their email uniquely matches Auth.
update public.users u
set auth_user_id = a.id
from auth.users a
where u.auth_user_id is null
  and u.email is not null
  and lower(u.email) = lower(a.email)
  and not exists (select 1 from public.users other where other.auth_user_id = a.id);

-- New Auth accounts receive a minimal profile. Roles remain membership-derived.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, auth_user_id, name, role, point, avatar, email, social_provider, social_id, created_at)
  values (
    new.id::text,
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(coalesce(new.email, '사용자'), '@', 1)),
    'TEACHER', 0, '👤', new.email, 'EMAIL', new.id::text, now()
  )
  on conflict (id) do update set auth_user_id = excluded.auth_user_id, email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.users where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.is_org_member(target_org text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = target_org
      and user_id = public.current_app_user_id()
      and status = 'ACTIVE'
  )
$$;

create or replace function public.is_org_facilitator(target_org text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where organization_id = target_org
      and user_id = public.current_app_user_id()
      and role in ('OWNER', 'TEACHER')
      and status = 'ACTIVE'
  )
$$;

create or replace function public.shares_org_with(target_user text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships mine
    join public.memberships theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = public.current_app_user_id()
      and theirs.user_id = target_user
      and mine.status = 'ACTIVE'
      and theirs.status = 'ACTIVE'
  )
$$;

-- Backfill organization ownership for legacy rows where migration 006 exists.
insert into public.organizations (id, name, type, owner_user_id, invite_code, created_at)
select 'legacy-org-' || u.id, u.name || '의 소속', 'EDUCATION', u.id, u.code, u.created_at
from public.users u
where u.role in ('PARENT', 'TEACHER')
on conflict (id) do nothing;

insert into public.memberships (id, user_id, organization_id, role, group_id, status, created_at)
select 'legacy-membership-' || u.id,
       u.id,
       'legacy-org-' || coalesce(u.facilitator_id, u.id),
       case when u.role = 'CHILD' then 'STUDENT' when u.role = 'PARENT' then 'OWNER' else 'TEACHER' end,
       u.group_id,
       'ACTIVE',
       u.created_at
from public.users u
where exists (select 1 from public.organizations o where o.id = 'legacy-org-' || coalesce(u.facilitator_id, u.id))
on conflict do nothing;

update public.performer_groups g set organization_id = 'legacy-org-' || g.facilitator_id where g.organization_id is null;
update public.missions m set organization_id = 'legacy-org-' || m.creator_id where m.organization_id is null;
update public.mission_submissions s set organization_id = m.organization_id from public.missions m where s.mission_id = m.id and s.organization_id is null;
update public.mission_review_logs l set organization_id = m.organization_id from public.missions m where l.mission_id = m.id and l.organization_id is null;
update public.teacher_notes n
set organization_id = m.organization_id,
    author_id = coalesce(n.author_id, m.user_id)
from public.memberships m
where m.user_id = n.student_id and m.status = 'ACTIVE' and n.organization_id is null;

-- Prevent future unscoped operational rows after the backfill.
alter table public.performer_groups alter column organization_id set not null;
alter table public.missions alter column organization_id set not null;
alter table public.mission_submissions alter column organization_id set not null;
alter table public.mission_review_logs alter column organization_id set not null;
alter table public.teacher_notes alter column organization_id set not null;
alter table public.teacher_notes alter column author_id set not null;

-- Remove every permissive legacy policy, then install least-privilege policies.
do $$
declare t text;
begin
  foreach t in array array[
    'users','organizations','memberships','performer_groups','missions',
    'mission_submissions','mission_review_logs','teacher_notes','reports','public_report_tokens'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists anon_all on public.%I', t);
  end loop;
end $$;

-- Retired reward/game tables must not remain anonymously readable or writable.
do $$
declare t text;
begin
  foreach t in array array[
    'point_transactions','ad_reward_logs','coupons','coupon_exchanges','mission_templates',
    'decoration_items','village_residents','achievements','villages','village_placements',
    'inventory_items','user_residents','user_achievements','character_cosmetics',
    'character_profiles','user_cosmetics','pets','home_placements'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists anon_all on public.%I', t);
      execute format('revoke all on public.%I from anon', t);
    end if;
  end loop;
end $$;

drop policy if exists users_select_scope on public.users;
create policy users_select_scope on public.users for select to authenticated
using (id = public.current_app_user_id() or public.shares_org_with(id));
drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update to authenticated
using (id = public.current_app_user_id()) with check (id = public.current_app_user_id());

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated using (public.is_org_member(id));
drop policy if exists memberships_select_scope on public.memberships;
create policy memberships_select_scope on public.memberships for select to authenticated
using (user_id = public.current_app_user_id() or public.is_org_facilitator(organization_id));

drop policy if exists groups_select_member on public.performer_groups;
create policy groups_select_member on public.performer_groups for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists groups_write_facilitator on public.performer_groups;
create policy groups_write_facilitator on public.performer_groups for all to authenticated
using (public.is_org_facilitator(organization_id)) with check (public.is_org_facilitator(organization_id));

drop policy if exists missions_select_member on public.missions;
create policy missions_select_member on public.missions for select to authenticated using (public.is_org_member(organization_id));
drop policy if exists missions_write_facilitator on public.missions;
create policy missions_write_facilitator on public.missions for all to authenticated
using (public.is_org_facilitator(organization_id)) with check (
  public.is_org_facilitator(organization_id)
  and creator_id = public.current_app_user_id()
  and exists (
    select 1 from public.memberships member
    where member.organization_id = missions.organization_id
      and member.user_id = missions.assignee_id
      and member.status = 'ACTIVE'
  )
);

drop policy if exists submissions_select_scope on public.mission_submissions;
create policy submissions_select_scope on public.mission_submissions for select to authenticated
using (public.is_org_facilitator(organization_id) or user_id = public.current_app_user_id());
drop policy if exists reviews_select_scope on public.mission_review_logs;
create policy reviews_select_scope on public.mission_review_logs for select to authenticated
using (
  public.is_org_facilitator(organization_id)
  or exists (select 1 from public.mission_submissions s where s.id = submission_id and s.user_id = public.current_app_user_id())
);

drop policy if exists notes_facilitator_only on public.teacher_notes;
create policy notes_facilitator_only on public.teacher_notes for all to authenticated
using (public.is_org_facilitator(organization_id)) with check (public.is_org_facilitator(organization_id));
drop policy if exists reports_facilitator_only on public.reports;
create policy reports_facilitator_only on public.reports for all to authenticated
using (public.is_org_facilitator(organization_id)) with check (public.is_org_facilitator(organization_id));

revoke all on public.public_report_tokens from anon, authenticated;
revoke all on public.reports from anon;
revoke update on public.users from authenticated;
grant update (name, avatar, profile_image, status_thresholds) on public.users to authenticated;

create or replace function public.create_organization(org_id text, org_name text, invite_code text)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare app_user text := public.current_app_user_id(); result public.memberships;
begin
  if app_user is null then raise exception 'AUTH_REQUIRED'; end if;
  insert into public.organizations(id, name, type, owner_user_id, invite_code)
  values (org_id, trim(org_name), 'EDUCATION', app_user, upper(invite_code));
  insert into public.memberships(id, user_id, organization_id, role, status)
  values ('membership-' || gen_random_uuid()::text, app_user, org_id, 'OWNER', 'ACTIVE') returning * into result;
  return result;
end;
$$;

create or replace function public.join_organization(provided_invite_code text)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare app_user text := public.current_app_user_id(); target_org text; result public.memberships;
begin
  if app_user is null then raise exception 'AUTH_REQUIRED'; end if;
  select id into target_org from public.organizations where upper(organizations.invite_code) = upper(trim(provided_invite_code));
  if target_org is null then raise exception 'INVITE_NOT_FOUND'; end if;
  select * into result from public.memberships where user_id = app_user and organization_id = target_org and status = 'ACTIVE' limit 1;
  if found then return result; end if;
  insert into public.memberships(id, user_id, organization_id, role, status)
  values ('membership-' || gen_random_uuid()::text, app_user, target_org, 'STUDENT', 'ACTIVE') returning * into result;
  return result;
end;
$$;

create or replace function public.submit_mission_atomic(
  target_mission text, submission_id text, submission_message text default null, submission_image_url text default null
)
returns public.mission_submissions
language plpgsql
security definer
set search_path = public
as $$
declare app_user text := public.current_app_user_id(); target public.missions; result public.mission_submissions; attempt int;
begin
  select * into target from public.missions where id = target_mission for update;
  if target.id is null or app_user is null then raise exception 'MISSION_NOT_FOUND'; end if;
  if target.assignee_id <> app_user then raise exception 'MISSION_FORBIDDEN'; end if;
  if target.status not in ('PENDING','IN_PROGRESS','REJECTED') then raise exception 'MISSION_NOT_SUBMITTABLE'; end if;
  select coalesce(max(attempt_number), 0) + 1 into attempt from public.mission_submissions where mission_id = target_mission and user_id = app_user;
  insert into public.mission_submissions(id, mission_id, user_id, organization_id, message, image_url, attempt_number)
  values (submission_id, target_mission, app_user, target.organization_id, nullif(trim(submission_message), ''), submission_image_url, attempt)
  returning * into result;
  update public.missions set status = 'REVIEWING' where id = target_mission;
  return result;
end;
$$;

create or replace function public.review_mission_atomic(
  target_mission text, target_action text, review_reason text default null, review_id text default null
)
returns public.mission_review_logs
language plpgsql
security definer
set search_path = public
as $$
declare app_user text := public.current_app_user_id(); target public.missions; latest public.mission_submissions; result public.mission_review_logs;
begin
  select * into target from public.missions where id = target_mission for update;
  if target.id is null or not public.is_org_facilitator(target.organization_id) then raise exception 'MISSION_FORBIDDEN'; end if;
  if target.status <> 'REVIEWING' then raise exception 'MISSION_NOT_REVIEWABLE'; end if;
  if upper(target_action) not in ('APPROVED','REJECTED') then raise exception 'INVALID_REVIEW_ACTION'; end if;
  if upper(target_action) = 'REJECTED' and nullif(trim(review_reason), '') is null then raise exception 'REJECTION_REASON_REQUIRED'; end if;
  select * into latest from public.mission_submissions where mission_id = target_mission order by attempt_number desc, submitted_at desc limit 1;
  if latest.id is null then raise exception 'SUBMISSION_NOT_FOUND'; end if;
  insert into public.mission_review_logs(id, mission_id, submission_id, reviewer_id, organization_id, action, reason)
  values (coalesce(review_id, 'review-' || gen_random_uuid()::text), target_mission, latest.id, app_user, target.organization_id, upper(target_action), nullif(trim(review_reason), ''))
  returning * into result;
  update public.missions set status = case when upper(target_action) = 'APPROVED' then 'SUCCESS' else 'REJECTED' end where id = target_mission;
  return result;
end;
$$;

create or replace function public.create_public_report(
  report_id text, target_org text, target_student text, report_snapshot jsonb, valid_days int default 7
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare app_user text := public.current_app_user_id(); raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
begin
  if not public.is_org_facilitator(target_org) then raise exception 'REPORT_FORBIDDEN'; end if;
  if not exists (select 1 from public.memberships where organization_id = target_org and user_id = target_student and status = 'ACTIVE') then raise exception 'STUDENT_OUTSIDE_ORG'; end if;
  insert into public.reports(id, organization_id, student_id, created_by, snapshot)
  values(report_id, target_org, target_student, app_user, report_snapshot)
  on conflict(id) do update set snapshot = excluded.snapshot, updated_at = now();
  insert into public.public_report_tokens(report_id, token_hash, expires_at, created_by)
  values(report_id, encode(extensions.digest(raw_token, 'sha256'), 'hex'), now() + make_interval(days => greatest(1, least(valid_days, 30))), app_user);
  return raw_token;
end;
$$;

create or replace function public.get_public_report(raw_token text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select r.snapshot
  from public.public_report_tokens t
  join public.reports r on r.id = t.report_id
  where t.token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and t.revoked_at is null and t.expires_at > now()
  limit 1
$$;

revoke all on function public.create_organization(text,text,text) from public;
revoke all on function public.join_organization(text) from public;
revoke all on function public.submit_mission_atomic(text,text,text,text) from public;
revoke all on function public.review_mission_atomic(text,text,text,text) from public;
revoke all on function public.create_public_report(text,text,text,jsonb,int) from public;
revoke all on function public.get_public_report(text) from public;
grant execute on function public.create_organization(text,text,text) to authenticated;
grant execute on function public.join_organization(text) to authenticated;
grant execute on function public.submit_mission_atomic(text,text,text,text) to authenticated;
grant execute on function public.review_mission_atomic(text,text,text,text) to authenticated;
grant execute on function public.create_public_report(text,text,text,jsonb,int) to authenticated;
grant execute on function public.get_public_report(text) to anon, authenticated;
