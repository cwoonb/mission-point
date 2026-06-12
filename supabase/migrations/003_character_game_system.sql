-- Mission Point: 사람 캐릭터 / 집 내부 / 마을 생활 게임 시스템 추가 마이그레이션
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
--
-- 이 마이그레이션은 기존 schema.sql, 001, 002를 보존한 채로 추가되는 ADDITIVE 마이그레이션입니다.
-- coupons / coupon_exchanges 등 legacy 테이블과 데이터는 그대로 유지되며 삭제하지 않습니다.

-- ── 마을 배치에 구역(zone) 정보 추가 ──────────────────────
-- HOUSE_EXTERIOR(집 앞) / HOUSE_INTERIOR(집 안) / VILLAGE(마을) 중 어디에 보여줄지 구분
alter table village_placements add column if not exists zone text not null default 'VILLAGE';

-- ── 집 내부 가구 슬롯에 맞춰 기존 장식 아이템 슬롯 보정 ─────
update decoration_items set slot = 'DESK' where id in ('deco-desk', 'deco-board', 'deco-calc', 'deco-wordcards', 'deco-review-desk');
update decoration_items set slot = 'BOOKSHELF' where id in ('deco-bookshelf', 'deco-reading-chair');

-- ── 집 내부 전용 신규 장식 아이템 ──────────────────────────
insert into decoration_items (id, name, description, emoji, category, slot, rarity, required_point, required_level, unlock_mission_type, enabled) values
('deco-bed-basic', '아늑한 침대', '하루를 마무리하고 푹 쉴 수 있는 침대예요.', '🛏️', 'FURNITURE', 'BED', 'COMMON', 70, 1, 'LIFESTYLE', true),
('deco-bed-cozy', '포근한 이층 침대', '폭신폭신, 더 넓고 포근한 침대예요.', '🛌', 'FURNITURE', 'BED', 'RARE', 180, 2, 'LIFESTYLE', true),
('deco-rug-round', '동그란 러그', '방바닥을 포근하게 채워주는 러그예요.', '🟤', 'FURNITURE', 'RUG', 'COMMON', 50, 1, null, true),
('deco-rug-stripe', '줄무늬 러그', '알록달록한 줄무늬 러그예요.', '🟧', 'FURNITURE', 'RUG', 'RARE', 140, 2, null, true),
('deco-window-basic', '동그란 창문', '햇살이 잘 들어오는 작은 창문이에요.', '🪟', 'FURNITURE', 'WINDOW', 'COMMON', 60, 1, null, true),
('deco-window-curtain', '커튼 창문', '예쁜 커튼이 달린 창문이에요.', '🌇', 'FURNITURE', 'WINDOW', 'RARE', 150, 3, null, true)
on conflict (id) do nothing;

-- ── 사람 캐릭터: 코스튬(의상) 카탈로그 ──────────────────────
create table if not exists character_cosmetics (
  id text primary key,
  name text not null,
  slot text not null,
  emoji text not null,
  color text not null,
  rarity text not null default 'COMMON',
  required_point integer not null default 0,
  required_level integer not null default 1,
  unlock_mission_type text,
  enabled boolean not null default true
);

-- ── 사람 캐릭터: 외형 프로필 (유저당 1개) ───────────────────
create table if not exists character_profiles (
  id text primary key,
  user_id text not null references users(id),
  name text not null,
  gender text not null default 'A',
  skin_color text not null default '#FFD9B3',
  hair_style text not null default 'short',
  hair_color text not null default '#4A3526',
  eye_shape text not null default 'round',
  -- 슬롯별 장착중인 코스튬 id 맵 (예: {"TOP":"cos-top-basic","BOTTOM":"cos-bottom-basic"})
  equipped jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists character_profiles_user_unique on character_profiles(user_id);

-- ── 사람 캐릭터: 보유 코스튬 ─────────────────────────────────
create table if not exists user_cosmetics (
  id text primary key,
  user_id text not null references users(id),
  cosmetic_id text not null references character_cosmetics(id),
  acquired_via text not null default 'PURCHASE',
  acquired_at timestamptz not null default now()
);
create unique index if not exists user_cosmetics_unique on user_cosmetics(user_id, cosmetic_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'character_cosmetics','character_profiles','user_cosmetics'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- ── 코스튬 카탈로그 시드 데이터 ───────────────────────────
insert into character_cosmetics (id, name, slot, emoji, color, rarity, required_point, required_level, unlock_mission_type, enabled) values
('cos-top-basic', '기본 티셔츠', 'TOP', '👕', '#fb923c', 'COMMON', 0, 1, null, true),
('cos-bottom-basic', '기본 반바지', 'BOTTOM', '🩳', '#3b82f6', 'COMMON', 0, 1, null, true),
('cos-shoes-basic', '기본 운동화', 'SHOES', '👟', '#f8fafc', 'COMMON', 0, 1, null, true),
('cos-top-stripe', '줄무늬 티셔츠', 'TOP', '👕', '#10b981', 'COMMON', 80, 1, null, true),
('cos-top-hoodie', '포근한 후드티', 'TOP', '🧥', '#8b5cf6', 'RARE', 150, 2, null, true),
('cos-bottom-jeans', '청바지', 'BOTTOM', '👖', '#1d4ed8', 'RARE', 130, 2, null, true),
('cos-shoes-sneaker', '컬러 스니커즈', 'SHOES', '👟', '#ef4444', 'RARE', 120, 2, null, true),
('cos-hat-cap', '야구모자', 'HAT', '🧢', '#f59e0b', 'COMMON', 60, 1, 'ATTENDANCE', true),
('cos-hat-beanie', '비니', 'HAT', '🎩', '#6366f1', 'RARE', 140, 3, null, true),
('cos-glasses-round', '동그란 안경', 'GLASSES', '👓', '#334155', 'COMMON', 90, 1, 'HOMEWORK', true),
('cos-glasses-star', '별모양 선글라스', 'GLASSES', '🕶️', '#ec4899', 'EPIC', 260, 4, null, true),
('cos-socks-stripe', '줄무늬 양말', 'SOCKS', '🧦', '#f97316', 'COMMON', 40, 1, null, true),
('cos-gloves-mitten', '벙어리장갑', 'GLOVES', '🧤', '#14b8a6', 'RARE', 110, 2, 'LIFESTYLE', true),
('cos-bag-backpack', '책가방', 'BAG', '🎒', '#84cc16', 'COMMON', 100, 1, 'VOCABULARY', true),
('cos-bag-explorer', '탐험가 가방', 'BAG', '🎒', '#a855f7', 'EPIC', 300, 4, null, true)
on conflict (id) do nothing;

-- ── 데모 캐릭터 프로필 시드 데이터 (실천자 4명) ────────────
insert into character_profiles (id, user_id, name, gender, skin_color, hair_style, hair_color, eye_shape, equipped) values
('char-child-1', 'user-child-1', '김철수', 'A', '#ffd9b3', 'short', '#3b2f2f', 'round', '{"TOP":"cos-top-basic","BOTTOM":"cos-bottom-basic","SHOES":"cos-shoes-basic","HAT":"cos-hat-cap"}'::jsonb),
('char-child-2', 'user-child-2', '박영희', 'B', '#ffe0c2', 'ponytail', '#5a3825', 'happy', '{"TOP":"cos-top-stripe","BOTTOM":"cos-bottom-basic","SHOES":"cos-shoes-basic"}'::jsonb),
('char-child-3', 'user-child-3', '이민수', 'A', '#f4c89a', 'curly', '#1f2937', 'sleepy', '{"TOP":"cos-top-basic","BOTTOM":"cos-bottom-basic","SHOES":"cos-shoes-basic"}'::jsonb),
('char-child-4', 'user-child-4', '최지훈', 'B', '#ffd9b3', 'bowl', '#7a4a2a', 'star', '{"TOP":"cos-top-basic","BOTTOM":"cos-bottom-basic","SHOES":"cos-shoes-basic"}'::jsonb)
on conflict (id) do nothing;

-- ── 데모 보유 코스튬 시드 데이터 ───────────────────────────
insert into user_cosmetics (id, user_id, cosmetic_id, acquired_via) values
('uc-1', 'user-child-1', 'cos-top-basic', 'STARTER'),
('uc-2', 'user-child-1', 'cos-bottom-basic', 'STARTER'),
('uc-3', 'user-child-1', 'cos-shoes-basic', 'STARTER'),
('uc-4', 'user-child-1', 'cos-hat-cap', 'MISSION_REWARD'),
('uc-5', 'user-child-2', 'cos-top-basic', 'STARTER'),
('uc-6', 'user-child-2', 'cos-bottom-basic', 'STARTER'),
('uc-7', 'user-child-2', 'cos-shoes-basic', 'STARTER'),
('uc-8', 'user-child-2', 'cos-top-stripe', 'PURCHASE'),
('uc-9', 'user-child-3', 'cos-top-basic', 'STARTER'),
('uc-10', 'user-child-3', 'cos-bottom-basic', 'STARTER'),
('uc-11', 'user-child-3', 'cos-shoes-basic', 'STARTER'),
('uc-12', 'user-child-4', 'cos-top-basic', 'STARTER'),
('uc-13', 'user-child-4', 'cos-bottom-basic', 'STARTER'),
('uc-14', 'user-child-4', 'cos-shoes-basic', 'STARTER')
on conflict (id) do nothing;
