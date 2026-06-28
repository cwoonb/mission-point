-- Mission Point: 개인 공간(집/마당) 꾸미기 배치 동기화 테이블
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
--
-- 이 마이그레이션은 기존 schema.sql, 001~004를 보존한 채로 추가되는 ADDITIVE 마이그레이션입니다.

-- ── 개인 공간 자유 배치 (실천자별, 좌표 0~1 정규화) ──────────
create table if not exists home_placements (
  id text primary key,
  owner_id text not null references users(id),
  area text not null default 'YARD',
  item_id text not null,
  x double precision not null,
  y double precision not null,
  rotation integer not null default 0,
  flip_x boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists home_placements_owner_idx on home_placements(owner_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- 데모/익명 모드 호환을 위해 기존 마이그레이션과 동일하게 anon_all 정책을 부여한다.
do $$
declare t text;
begin
  for t in select unnest(array[
    'home_placements'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;
