-- Mission Point: Supabase schema
-- Fresh-project bootstrap only. Existing projects must use numbered additive migrations.
-- This file never drops operational tables or creates anonymous write policies.
--
-- NOTE: IDs are plain text (matching the app's existing string IDs like
-- 'user-parent-1' and genId()-generated values), not uuid.

-- ── USERS ─────────────────────────────────────────────────
create table if not exists users (
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
create table if not exists performer_groups (
  id text primary key,
  name text not null,
  emoji text not null default '👥',
  facilitator_id text not null references users(id),
  created_at timestamptz not null default now()
);

alter table users add constraint users_group_fk foreign key (group_id) references performer_groups(id);

-- ── MISSIONS ──────────────────────────────────────────────
create table if not exists missions (
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
create table if not exists mission_submissions (
  id text primary key,
  mission_id text not null references missions(id),
  user_id text not null references users(id),
  message text,
  image_url text,
  attempt_number integer not null default 1,
  submitted_at timestamptz not null default now()
);

-- ── MISSION REVIEW LOGS ───────────────────────────────────
create table if not exists mission_review_logs (
  id text primary key,
  mission_id text not null references missions(id),
  submission_id text not null references mission_submissions(id),
  reviewer_id text not null references users(id),
  action text not null check (action in ('APPROVED','REJECTED')),
  reason text,
  created_at timestamptz not null default now()
);

-- ── POINT TRANSACTIONS ────────────────────────────────────
create table if not exists point_transactions (
  id text primary key,
  user_id text not null references users(id),
  amount integer not null,
  type text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

-- ── AD REWARD LOGS ────────────────────────────────────────
create table if not exists ad_reward_logs (
  id text primary key,
  user_id text not null references users(id),
  reward_point integer not null,
  watched_at timestamptz not null default now()
);

-- ── COUPONS ───────────────────────────────────────────────
create table if not exists coupons (
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
create table if not exists coupon_exchanges (
  id text primary key,
  coupon_id text not null references coupons(id),
  user_id text not null references users(id),
  used_point integer not null,
  created_at timestamptz not null default now()
);

-- ── TEACHER NOTES ─────────────────────────────────────────
create table if not exists teacher_notes (
  id text primary key,
  student_id text not null references users(id),
  text text not null,
  created_at timestamptz not null default now()
);

-- ── MISSION TEMPLATES ─────────────────────────────────────
create table if not exists mission_templates (
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
-- Deny by default. Migration 007_launch_security.sql installs auth.uid()-based policies.
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
  end loop;
end $$;
