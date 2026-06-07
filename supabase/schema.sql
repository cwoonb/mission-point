-- Mission Point: Supabase schema
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
--
-- NOTE: IDs are plain text (matching the app's existing string IDs like
-- 'user-parent-1' and genId()-generated values), not uuid.

drop table if exists coupon_exchanges cascade;
drop table if exists mission_review_logs cascade;
drop table if exists mission_submissions cascade;
drop table if exists missions cascade;
drop table if exists point_transactions cascade;
drop table if exists ad_reward_logs cascade;
drop table if exists teacher_notes cascade;
drop table if exists mission_templates cascade;
drop table if exists coupons cascade;
drop table if exists performer_groups cascade;
drop table if exists users cascade;

-- ── USERS ─────────────────────────────────────────────────
create table users (
  id text primary key,
  name text not null,
  role text not null check (role in ('PARENT','TEACHER','CHILD')),
  point integer not null default 0,
  avatar text not null default '🙂',
  social_provider text check (social_provider in ('GOOGLE','KAKAO','NAVER')),
  social_id text,
  email text,
  profile_image text,
  facilitator_id text references users(id),
  group_id text,
  code text unique,
  created_at timestamptz not null default now()
);
create unique index users_social_unique on users(social_provider, social_id);

-- ── PERFORMER GROUPS ──────────────────────────────────────
create table performer_groups (
  id text primary key,
  name text not null,
  emoji text not null default '👥',
  facilitator_id text not null references users(id),
  created_at timestamptz not null default now()
);

alter table users add constraint users_group_fk foreign key (group_id) references performer_groups(id);

-- ── MISSIONS ──────────────────────────────────────────────
create table missions (
  id text primary key,
  title text not null,
  description text not null default '',
  reward_point integer not null default 0,
  creator_id text not null references users(id),
  assignee_id text not null references users(id),
  status text not null default 'PENDING',
  submission_type text not null default 'IMAGE',
  start_date timestamptz not null,
  end_date timestamptz not null,
  mission_type text,
  mission_goal text,
  repeat_type text,
  parent_share text,
  created_at timestamptz not null default now()
);

-- ── MISSION SUBMISSIONS ───────────────────────────────────
create table mission_submissions (
  id text primary key,
  mission_id text not null references missions(id),
  user_id text not null references users(id),
  message text,
  image_url text,
  attempt_number integer not null default 1,
  submitted_at timestamptz not null default now()
);

-- ── MISSION REVIEW LOGS ───────────────────────────────────
create table mission_review_logs (
  id text primary key,
  mission_id text not null references missions(id),
  submission_id text not null references mission_submissions(id),
  reviewer_id text not null references users(id),
  action text not null check (action in ('APPROVED','REJECTED')),
  reason text,
  created_at timestamptz not null default now()
);

-- ── POINT TRANSACTIONS ────────────────────────────────────
create table point_transactions (
  id text primary key,
  user_id text not null references users(id),
  amount integer not null,
  type text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ── AD REWARD LOGS ────────────────────────────────────────
create table ad_reward_logs (
  id text primary key,
  user_id text not null references users(id),
  reward_point integer not null,
  watched_at timestamptz not null default now()
);

-- ── COUPONS ───────────────────────────────────────────────
create table coupons (
  id text primary key,
  name text not null,
  description text not null default '',
  emoji text not null default '🎁',
  required_point integer not null default 0,
  stock integer not null default 0,
  enabled boolean not null default true,
  category text not null default '',
  bg_color text not null default 'bg-purple-50'
);

-- ── COUPON EXCHANGES ──────────────────────────────────────
create table coupon_exchanges (
  id text primary key,
  coupon_id text not null references coupons(id),
  user_id text not null references users(id),
  used_point integer not null,
  created_at timestamptz not null default now()
);

-- ── TEACHER NOTES ─────────────────────────────────────────
create table teacher_notes (
  id text primary key,
  student_id text not null references users(id),
  text text not null,
  created_at timestamptz not null default now()
);

-- ── MISSION TEMPLATES ─────────────────────────────────────
create table mission_templates (
  id text primary key,
  facilitator_id text not null references users(id),
  name text not null,
  title text not null,
  description text not null default '',
  reward_point integer not null default 0,
  submission_type text not null default 'IMAGE',
  mission_type text,
  mission_goal text,
  repeat_type text,
  parent_share text,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- MVP: this app uses its own social-login flow (not Supabase Auth),
-- so auth.uid() is unavailable. We open read/write to the anon key
-- and rely on the app layer for access control. Revisit before
-- public launch (e.g. migrate to Supabase Auth + per-user policies).
do $$
declare t text;
begin
  for t in select unnest(array[
    'users','performer_groups','missions','mission_submissions',
    'mission_review_logs','point_transactions','ad_reward_logs',
    'coupons','coupon_exchanges','teacher_notes','mission_templates'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;
