-- Additive migration. Existing users.role remains for backward compatibility.
alter table public.users drop constraint if exists users_social_provider_check;
alter table public.users add constraint users_social_provider_check check (social_provider in ('GOOGLE', 'KAKAO', 'NAVER', 'EMAIL'));

create table if not exists public.organizations (
  id text primary key,
  name text not null,
  type text not null default 'EDUCATION',
  owner_user_id text not null references public.users(id) on delete cascade,
  invite_code text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  organization_id text not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('OWNER', 'TEACHER', 'STUDENT')),
  group_id text references public.performer_groups(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INVITED', 'INACTIVE')),
  created_at timestamptz not null default now(),
  unique (user_id, organization_id, role, group_id)
);

create index if not exists memberships_user_id_idx on public.memberships(user_id);
create index if not exists memberships_organization_id_idx on public.memberships(organization_id);

alter table public.missions add column if not exists organization_id text references public.organizations(id) on delete set null;
create index if not exists missions_organization_id_idx on public.missions(organization_id);
