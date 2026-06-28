-- Mission Point: 다마고치식 펫 육성 시스템 추가 마이그레이션
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
--
-- 이 마이그레이션은 기존 schema.sql, 001~003을 보존한 채로 추가되는 ADDITIVE 마이그레이션입니다.

-- ── 펫 (실천자별 보유 동물) ─────────────────────────────────
create table if not exists pets (
  id text primary key,
  owner_id text not null references users(id),
  species text not null,
  name text not null default '',
  stage text not null default 'egg',
  exp integer not null default 0,
  total_exp integer not null default 0,
  happiness integer not null default 80,
  accessories jsonb not null default '[]'::jsonb,
  hatched boolean not null default false,
  is_active boolean not null default false,
  last_interacted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists pets_owner_idx on pets(owner_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- 데모/익명 모드 호환을 위해 기존 마이그레이션과 동일하게 anon_all 정책을 부여한다.
-- (소유자 본인 또는 연결된 리더만 접근하도록 좁히려면 이후 auth 연동 시 정책을 교체한다)
do $$
declare t text;
begin
  for t in select unnest(array[
    'pets'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- ── 데모 펫 시드 데이터 (실천자 4명에게 알 1개씩) ────────────
insert into pets (id, owner_id, species, name, stage, exp, total_exp, happiness, accessories, hatched, is_active) values
('pet-child-1', 'user-child-1', 'cat', '', 'egg', 0, 0, 80, '[]'::jsonb, false, true),
('pet-child-2', 'user-child-2', 'dog', '', 'egg', 0, 0, 80, '[]'::jsonb, false, true),
('pet-child-3', 'user-child-3', 'rabbit', '', 'egg', 0, 0, 80, '[]'::jsonb, false, true),
('pet-child-4', 'user-child-4', 'bird', '', 'egg', 0, 0, 80, '[]'::jsonb, false, true)
on conflict (id) do nothing;
