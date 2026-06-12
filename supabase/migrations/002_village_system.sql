-- Mission Point: 마을 꾸미기 / 동물 주민 시스템 추가 마이그레이션
-- Run this once in the Supabase SQL Editor (Dashboard > SQL Editor > New query > Run)
--
-- 이 마이그레이션은 기존 schema.sql을 보존한 채로 추가되는 ADDITIVE 마이그레이션입니다.
-- coupons / coupon_exchanges 테이블과 데이터는 legacy로 그대로 유지되며 삭제하지 않습니다.

-- ── 장식 아이템 카탈로그 ──────────────────────────────────
create table if not exists decoration_items (
  id text primary key,
  name text not null,
  description text not null default '',
  emoji text not null,
  category text not null,
  slot text,
  rarity text not null default 'COMMON',
  required_point integer not null default 0,
  required_level integer not null default 1,
  unlock_mission_type text,
  enabled boolean not null default true
);

-- ── 동물 주민 카탈로그 ────────────────────────────────────
create table if not exists village_residents (
  id text primary key,
  name text not null,
  emoji text not null,
  personality text not null,
  description text not null default '',
  related_mission_types text[] not null default '{}',
  required_level integer not null default 1,
  unlock_hint text not null default ''
);

-- ── 업적 카탈로그 ─────────────────────────────────────────
create table if not exists achievements (
  id text primary key,
  name text not null,
  description text not null default '',
  emoji text not null,
  condition_type text not null,
  condition_value integer not null,
  condition_mission_type text,
  reward_point integer not null default 0,
  reward_item_id text references decoration_items(id),
  reward_resident_id text references village_residents(id)
);

-- ── 마을 ──────────────────────────────────────────────────
create table if not exists villages (
  id text primary key,
  owner_id text not null references users(id),
  name text not null,
  level integer not null default 1,
  exp integer not null default 0,
  theme text not null default 'default',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists villages_owner_unique on villages(owner_id);

-- ── 마을 배치 (슬롯 기반, 추후 자유 좌표 그리드로 확장 가능) ─
create table if not exists village_placements (
  id text primary key,
  village_id text not null references villages(id),
  slot text not null,
  item_id text not null references decoration_items(id),
  placed_at timestamptz not null default now()
);
create unique index if not exists village_placements_slot_unique on village_placements(village_id, slot);

-- ── 보유 인벤토리 (구매/보상으로 획득한 장식 아이템) ───────
create table if not exists inventory_items (
  id text primary key,
  user_id text not null references users(id),
  item_id text not null references decoration_items(id),
  quantity integer not null default 1,
  acquired_via text not null default 'PURCHASE',
  acquired_at timestamptz not null default now()
);

-- ── 보유 동물 주민 ────────────────────────────────────────
create table if not exists user_residents (
  id text primary key,
  user_id text not null references users(id),
  resident_id text not null references village_residents(id),
  acquired_via text not null default 'ACHIEVEMENT',
  acquired_at timestamptz not null default now()
);
create unique index if not exists user_residents_unique on user_residents(user_id, resident_id);

-- ── 달성한 업적 ───────────────────────────────────────────
create table if not exists user_achievements (
  id text primary key,
  user_id text not null references users(id),
  achievement_id text not null references achievements(id),
  unlocked_at timestamptz not null default now()
);
create unique index if not exists user_achievements_unique on user_achievements(user_id, achievement_id);

-- ── PointTransaction에 DECORATION_PURCHASE 타입 추가 ──────
-- point_transactions.type 컬럼은 text이며 check 제약이 없으므로 추가 작업 불필요.

-- ── ROW LEVEL SECURITY ────────────────────────────────────
do $$
declare t text;
begin
  for t in select unnest(array[
    'decoration_items','village_residents','achievements',
    'villages','village_placements','inventory_items',
    'user_residents','user_achievements'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;

-- ── 카탈로그 시드 데이터 ──────────────────────────────────

-- 장식 아이템
insert into decoration_items (id, name, description, emoji, category, slot, rarity, required_point, required_level, unlock_mission_type, enabled) values
('deco-house-basic', '작은 오두막', '아담하고 포근한 첫 번째 집이에요.', '🏠', 'HOUSE', 'HOUSE', 'COMMON', 0, 1, null, true),
('deco-house-cottage', '아늑한 집', '나무로 지은 따뜻한 시골집이에요.', '🏡', 'HOUSE', 'HOUSE', 'RARE', 300, 2, null, true),
('deco-house-tower', '멋진 타워하우스', '마을에서 가장 높고 멋진 집이에요.', '🏰', 'HOUSE', 'HOUSE', 'EPIC', 800, 5, null, true),
('deco-desk', '공부 책상', '숙제를 척척 해낼 수 있는 책상이에요.', '🪑', 'FURNITURE', 'INTERIOR', 'COMMON', 80, 1, 'HOMEWORK', true),
('deco-board', '칠판', '오늘 배운 내용을 정리할 수 있어요.', '🖍️', 'FURNITURE', 'INTERIOR', 'COMMON', 100, 1, 'HOMEWORK', true),
('deco-calc', '계산기 세트', '어려운 계산도 척척 해결해줘요.', '🧮', 'STUDY_TOOL', 'INTERIOR', 'RARE', 150, 2, 'HOMEWORK', true),
('deco-bookshelf', '책장', '좋아하는 책을 가지런히 꽂아둬요.', '📚', 'FURNITURE', 'INTERIOR', 'COMMON', 90, 1, 'READING', true),
('deco-reading-chair', '독서 의자', '편안하게 앉아 책을 읽을 수 있어요.', '🛋️', 'FURNITURE', 'INTERIOR', 'RARE', 130, 2, 'READING', true),
('deco-wordcards', '단어 카드 책상', '새로운 단어를 익힐 수 있는 책상이에요.', '🔤', 'STUDY_TOOL', 'INTERIOR', 'COMMON', 110, 1, 'VOCABULARY', true),
('deco-review-desk', '복습 책상', '틀린 문제를 다시 풀어볼 수 있어요.', '📓', 'STUDY_TOOL', 'INTERIOR', 'RARE', 120, 2, 'REVIEW_NOTES', true),
('deco-tree-small', '어린 나무', '마을 마당에 심은 작은 나무예요.', '🌳', 'TREE', 'GARDEN', 'COMMON', 50, 1, 'LIFESTYLE', true),
('deco-tree-big', '튼튼한 나무', '오랫동안 자라온 튼튼한 나무예요.', '🌲', 'TREE', 'GARDEN', 'RARE', 200, 3, null, true),
('deco-flower-tulip', '튤립 화단', '알록달록한 튤립이 피어 있어요.', '🌷', 'FLOWER', 'GARDEN', 'COMMON', 50, 1, 'LIFESTYLE', true),
('deco-flower-sunflower', '해바라기 밭', '해를 보고 활짝 웃는 해바라기예요.', '🌻', 'FLOWER', 'GARDEN', 'RARE', 120, 2, 'LIFESTYLE', true),
('deco-path-stone', '돌길', '마을을 가로지르는 작은 돌길이에요.', '🪨', 'ROAD', 'PATH', 'COMMON', 60, 1, null, true),
('deco-path-flower', '꽃길', '꽃잎이 흩날리는 예쁜 길이에요.', '🌸', 'ROAD', 'PATH', 'EPIC', 250, 4, 'LIFESTYLE', true),
('deco-fence-wood', '나무 울타리', '마당을 아늑하게 둘러싸 줘요.', '🚧', 'FENCE', 'PATH', 'COMMON', 70, 1, null, true),
('deco-fence-flower', '꽃 울타리', '작은 꽃으로 장식된 울타리예요.', '🌼', 'FENCE', 'PATH', 'RARE', 160, 3, null, true),
('deco-school', '학교 건물', '마을 친구들이 모이는 학교예요.', '🏫', 'SCHOOL', 'SCHOOL', 'EPIC', 350, 3, 'ATTENDANCE', true),
('deco-library', '작은 도서관', '다양한 책을 빌릴 수 있는 도서관이에요.', '📖', 'SCHOOL', 'SCHOOL', 'EPIC', 400, 3, 'READING', true),
('deco-langlab', '언어 연구소', '새로운 단어를 연구하는 곳이에요.', '🔬', 'SCHOOL', 'SCHOOL', 'LEGENDARY', 500, 4, 'VOCABULARY', true),
('deco-gate', '교문', '학교로 들어가는 멋진 문이에요.', '🚪', 'SCHOOL', 'SCHOOL', 'RARE', 200, 2, 'ATTENDANCE', true),
('deco-petbed', '포근한 펫 침대', '주민들이 편히 쉴 수 있는 침대예요.', '🛏️', 'PET', 'YARD', 'COMMON', 100, 2, 'LIFESTYLE', true),
('deco-fishtank', '작은 어항', '알록달록한 물고기가 헤엄쳐요.', '🐠', 'PET', 'YARD', 'RARE', 150, 3, null, true),
('deco-theme-spring', '봄 테마', '마을 전체가 봄빛으로 물들어요.', '🌸', 'THEME', null, 'RARE', 300, 3, null, true),
('deco-theme-night', '밤하늘 테마', '별이 빛나는 밤의 마을이 돼요.', '🌙', 'THEME', null, 'EPIC', 400, 4, null, true)
on conflict (id) do nothing;

-- 동물 주민
insert into village_residents (id, name, emoji, personality, description, related_mission_types, required_level, unlock_hint) values
('resident-rabbit', '토끼', '🐰', '활발하고 발이 빠른', '아침 일찍부터 마을을 신나게 뛰어다녀요.', array['ATTENDANCE','LIFESTYLE'], 1, '출석과 생활습관 미션을 잘 챙기면 만날 수 있어요.'),
('resident-dog', '강아지', '🐶', '꾸준하고 친근한', '매일매일 변함없이 곁을 지켜줘요.', array[]::text[], 1, '미션을 연속으로 성공하면 만날 수 있어요.'),
('resident-squirrel', '다람쥐', '🐿️', '차곡차곡 모으는 걸 좋아하는', '도토리를 모으듯 단어를 차곡차곡 모아요.', array['VOCABULARY','READING'], 2, '단어 암기와 독서를 꾸준히 하면 만날 수 있어요.'),
('resident-cat', '고양이', '🐱', '조용히 책 읽는 걸 좋아하는', '햇살 좋은 자리에서 책 읽기를 즐겨요.', array['READING'], 2, '독서 미션을 꾸준히 하면 만날 수 있어요.'),
('resident-penguin', '펭귄', '🐧', '차분하고 규칙적인', '매일 같은 시간에 마을을 산책해요.', array['ATTENDANCE'], 2, '출석 미션을 꾸준히 하면 만날 수 있어요.'),
('resident-beaver', '비버', '🦫', '성실하고 손재주가 좋은', '무엇이든 차근차근 만들고 정리해요.', array['HOMEWORK','REVIEW_NOTES'], 3, '숙제와 오답정리를 꾸준히 하면 만날 수 있어요.'),
('resident-fox', '여우', '🦊', '똑똑하고 문제 해결을 좋아하는', '어려운 문제도 척척 풀어내요.', array['HOMEWORK','REVIEW_NOTES'], 4, '오답정리를 열심히 하면 만날 수 있어요.'),
('resident-bear', '곰', '🐻', '든든하고 포근한', '마을이 잘 자라도록 든든하게 지켜줘요.', array['LIFESTYLE'], 5, '마을이 충분히 성장하면 만날 수 있어요.')
on conflict (id) do nothing;

-- 업적
insert into achievements (id, name, description, emoji, condition_type, condition_value, condition_mission_type, reward_point, reward_item_id, reward_resident_id) values
('ach-first-step', '첫 발걸음', '첫 미션을 성공했어요!', '🎉', 'MISSION_COUNT', 1, null, 50, 'deco-desk', null),
('ach-streak-3', '3일 연속 성공', '3일 연속으로 미션을 성공했어요!', '🔥', 'STREAK', 3, null, 30, null, 'resident-dog'),
('ach-streak-7', '일주일 개근', '7일 연속으로 미션을 성공했어요!', '🔥', 'STREAK', 7, null, 100, 'deco-fence-wood', null),
('ach-reading-5', '책벌레', '독서 미션을 5회 완료했어요!', '📖', 'MISSION_TYPE_COUNT', 5, 'READING', 0, 'deco-bookshelf', 'resident-cat'),
('ach-homework-5', '성실한 일꾼', '숙제 미션을 5회 완료했어요!', '✏️', 'MISSION_TYPE_COUNT', 5, 'HOMEWORK', 0, null, 'resident-beaver'),
('ach-vocab-5', '단어 수집가', '단어암기 미션을 5회 완료했어요!', '🔤', 'MISSION_TYPE_COUNT', 5, 'VOCABULARY', 0, null, 'resident-squirrel'),
('ach-attendance-5', '개근왕', '출석 미션을 5회 완료했어요!', '✅', 'MISSION_TYPE_COUNT', 5, 'ATTENDANCE', 0, null, 'resident-penguin'),
('ach-lifestyle-5', '생활왕', '생활습관 미션을 5회 완료했어요!', '🌱', 'MISSION_TYPE_COUNT', 5, 'LIFESTYLE', 0, null, 'resident-rabbit'),
('ach-review-5', '복습 마스터', '오답정리 미션을 5회 완료했어요!', '🦊', 'MISSION_TYPE_COUNT', 5, 'REVIEW_NOTES', 0, null, 'resident-fox'),
('ach-village-5', '마을 번영', '마을 레벨 5를 달성했어요!', '🏆', 'VILLAGE_LEVEL', 5, null, 0, 'deco-school', 'resident-bear')
on conflict (id) do nothing;
