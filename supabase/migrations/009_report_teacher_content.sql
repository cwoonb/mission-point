-- Public report teacher content. Internal teacher_notes remain private counseling notes.
alter table public.mission_review_logs add column if not exists public_feedback text;

update public.mission_review_logs
set public_feedback = reason
where action = 'APPROVED' and public_feedback is null and nullif(trim(reason), '') is not null;
update public.mission_review_logs set reason = null where action = 'APPROVED' and public_feedback is not null;

alter table public.mission_review_logs drop constraint if exists mission_review_logs_public_feedback_length;
alter table public.mission_review_logs add constraint mission_review_logs_public_feedback_length
check (char_length(coalesce(public_feedback, '')) <= 300);

create table if not exists public.report_teacher_contents (
  organization_id text not null references public.organizations(id) on delete cascade,
  student_id text not null references public.users(id) on delete cascade,
  teacher_one_line_memo text not null default '',
  updated_by text not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, student_id),
  constraint report_teacher_contents_memo_length check (char_length(teacher_one_line_memo) <= 150)
);

alter table public.report_teacher_contents enable row level security;
drop policy if exists report_teacher_contents_facilitator on public.report_teacher_contents;
create policy report_teacher_contents_facilitator on public.report_teacher_contents for all to authenticated
using (public.is_org_facilitator(organization_id))
with check (public.is_org_facilitator(organization_id));
revoke all on public.report_teacher_contents from anon;
grant select on public.report_teacher_contents to authenticated;

create or replace function public.review_mission_atomic(
  target_mission text, target_action text, review_reason text default null,
  review_id text default null, review_public_feedback text default null
)
returns public.mission_review_logs
language plpgsql security definer set search_path = public
as $$
declare app_user text := public.current_app_user_id(); target public.missions; latest public.mission_submissions; result public.mission_review_logs;
begin
  select * into target from public.missions where id = target_mission for update;
  if target.id is null or not public.is_org_facilitator(target.organization_id) then raise exception 'MISSION_FORBIDDEN'; end if;
  if target.status <> 'REVIEWING' then raise exception 'MISSION_NOT_REVIEWABLE'; end if;
  if upper(target_action) not in ('APPROVED','REJECTED') then raise exception 'INVALID_REVIEW_ACTION'; end if;
  if upper(target_action) = 'REJECTED' and nullif(trim(review_reason), '') is null then raise exception 'REJECTION_REASON_REQUIRED'; end if;
  if char_length(coalesce(review_public_feedback, '')) > 300 then raise exception 'FEEDBACK_TOO_LONG'; end if;
  select * into latest from public.mission_submissions where mission_id = target_mission order by attempt_number desc, submitted_at desc limit 1;
  if latest.id is null then raise exception 'SUBMISSION_NOT_FOUND'; end if;
  insert into public.mission_review_logs(id, mission_id, submission_id, reviewer_id, organization_id, action, reason, public_feedback)
  values (
    coalesce(review_id, 'review-' || gen_random_uuid()::text), target_mission, latest.id, app_user,
    target.organization_id, upper(target_action),
    case when upper(target_action) = 'REJECTED' then nullif(trim(review_reason), '') else null end,
    nullif(trim(review_public_feedback), '')
  ) returning * into result;
  update public.missions set status = case when upper(target_action) = 'APPROVED' then 'SUCCESS' else 'REJECTED' end where id = target_mission;
  return result;
end;
$$;

create or replace function public.update_review_public_feedback(target_review text, new_feedback text)
returns public.mission_review_logs
language plpgsql security definer set search_path = public
as $$
declare target public.mission_review_logs;
begin
  select * into target from public.mission_review_logs where id = target_review for update;
  if target.id is null or not public.is_org_facilitator(target.organization_id) then raise exception 'REVIEW_FORBIDDEN'; end if;
  if char_length(coalesce(new_feedback, '')) > 300 then raise exception 'FEEDBACK_TOO_LONG'; end if;
  update public.mission_review_logs set public_feedback = nullif(trim(new_feedback), '') where id = target_review returning * into target;
  return target;
end;
$$;

create or replace function public.upsert_report_teacher_content(target_org text, target_student text, one_line_memo text)
returns public.report_teacher_contents
language plpgsql security definer set search_path = public
as $$
declare app_user text := public.current_app_user_id(); result public.report_teacher_contents;
begin
  if not public.is_org_facilitator(target_org) then raise exception 'REPORT_FORBIDDEN'; end if;
  if char_length(coalesce(one_line_memo, '')) > 150 then raise exception 'MEMO_TOO_LONG'; end if;
  if not exists (select 1 from public.memberships where organization_id = target_org and user_id = target_student and status = 'ACTIVE')
    then raise exception 'STUDENT_OUTSIDE_ORG'; end if;
  insert into public.report_teacher_contents(organization_id, student_id, teacher_one_line_memo, updated_by)
  values(target_org, target_student, trim(coalesce(one_line_memo, '')), app_user)
  on conflict(organization_id, student_id) do update
    set teacher_one_line_memo = excluded.teacher_one_line_memo, updated_by = excluded.updated_by, updated_at = now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.review_mission_atomic(text,text,text,text,text) from public;
revoke all on function public.update_review_public_feedback(text,text) from public;
revoke all on function public.upsert_report_teacher_content(text,text,text) from public;
grant execute on function public.review_mission_atomic(text,text,text,text,text) to authenticated;
grant execute on function public.update_review_public_feedback(text,text) to authenticated;
grant execute on function public.upsert_report_teacher_content(text,text,text) to authenticated;
