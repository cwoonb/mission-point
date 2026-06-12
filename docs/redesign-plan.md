# 미션 포인트 재설계 기획서: "쿠폰 보상 앱" → "학습 습관 육성 + 마을 성장 시뮬레이션"

> 상태: **승인됨 — 구현 진행 중**
> 작성일: 2026-06-11 / 승인 및 추가 요청 반영: 2026-06-11

---

## 추가 반영 사항 (승인 시 추가 요청, 2026-06-11)

기존 9개 섹션의 방향은 유지하고 아래 내용을 반영해 구현한다.

1. **홈 화면 = "내 집 앞" 화면**: 실천자 홈은 통계 대시보드가 아니라 내 집 앞마당 + 대표 동물 주민 + 오늘의 미션을 "표지판" 카드로 보여주는 화면으로 변경. 진행중/완료/검토중/반려 상태를 시각적으로 구분.
2. **"마을 들어가기" CTA**: 홈 화면에 큰 버튼으로 `/village` 이동, Framer Motion으로 캐릭터가 길을 따라 이동하는 가벼운 전환 연출 추가 (복잡한 3D/게임 엔진 불필요).
3. **VillageResident / UserResident 모델 추가**: 장식 아이템과 별개로 "동물 주민" 시스템 신설. 도감/카드 + 마을 화면 표시로 1차 구현 (자유 이동 애니메이션은 확장 과제).
   - 동물 주민 8종 (오리지널 디자인): 비버(숙제·오답정리), 토끼(출석·생활습관), 다람쥐(단어암기·독서), 고양이(독서), 강아지(스트릭), 여우(수학·오답정리), 곰(생활습관), 펭귄(출석·일일미션)
4. **상점/마을 슬롯 구조**: `/village/shop` 카테고리는 집/가구/나무/꽃/길/울타리/학교·도서관/학습도구/펫/테마 + 동물주민 탭으로 구성. 마을 배치는 자유 그리드 대신 7개 슬롯(집/실내가구/앞마당/정원/길·울타리/학교·도서관/동물주민) 기반 1차 구현, 추후 자유 좌표 그리드로 확장 가능하도록 슬롯-아이템 데이터 구조를 분리해 설계.
5. **기존 쿠폰 데이터 보존**: `coupons`/`coupon_exchanges` 테이블과 관련 타입은 삭제하지 않고 legacy로 보존. `point_transactions`의 과거 `COUPON_EXCHANGE` 이력 라벨도 유지. 신규 구매는 `DECORATION_PURCHASE`로 기록.
6. **저작권 주의**: 동물 주민의 이름/성격/디자인은 동물의숲·포코피아 등 기존 IP를 차용하지 않고 오리지널로 설계.
7. **신규 스토어**: `villageStore`(마을 레벨/경험치/배치), `decorationStore`(장식 카탈로그/인벤토리/주민/도감/업적) 추가. 1차는 localStorage(`persist`) 기반으로 구현하고, Supabase 동기화용 마이그레이션 SQL은 별도 파일로 작성.

---

## 추가 반영 사항 Phase 3 (사람 캐릭터 + 2D 동물 마을 생활 시뮬레이션, 2026-06-11)

Phase 2(마을 성장/꾸미기)까지의 방향은 그대로 유지하고, 다음을 추가로 구현한다. 최종 핵심 루프:

```
미션 수행 → 포인트/경험치 획득 → 사람 캐릭터 성장 → 집/마을 꾸미기 → 동물 주민 수집 → 마을 생활 게임
```

**핵심 원칙**: 주인공은 반드시 **사람 캐릭터**(플레이어), 동물은 **마을 주민/NPC**. 모든 캐릭터/세계 에셋은 CSS·이모지·SVG 기반 오리지널 디자인이며, 저작권 있는 게임(동물의숲·포코피아 등)의 캐릭터/이름/UI/에셋을 복제하지 않는다(분위기 참고만).

### P3.1 사람 캐릭터 시스템

- `src/types/index.ts`에 `CharacterProfile`, `CharacterCosmetic`, `UserCosmetic`, `CosmeticSlot`(`TOP|BOTTOM|SHOES|HAT|GLASSES|SOCKS|GLOVES|BAG`), `HairStyle`(`short|long|ponytail|curly|bowl`), `EyeShape`(`round|happy|sleepy|star`) 추가
- `src/store/characterStore.ts` (Zustand, `persist`, key `mp-character`): `profiles`, `cosmetics`, `userCosmetics` 상태 + `getProfile`/`ensureProfile`/`updateProfile`/`equipCosmetic`/`unequipCosmetic`/`grantCosmetic` 등
- 외형: 피부색 6종, 머리스타일 5종 × 머리색 8종, 눈 모양 4종(유니코드 글리프) — `src/components/game/PlayerCharacter.tsx`에서 전부 CSS 도형으로 렌더링(이미지 에셋 없음)
- 코스튬 8슬롯 × 15종 시드 데이터(`mockData.ts`의 `initialCharacterCosmetics`), 장착 정보는 `profile.equipped: Partial<Record<CosmeticSlot,string>>`
- `src/pages/CharacterCustomizePage.tsx`(`/character`) — 외형 커스터마이징 화면, GameScene 미리보기 + 의상 상점/보유함 바로가기

### P3.2 GameScene 기반 이동형 캐릭터 화면

- 공통 컴포넌트(`src/components/game/`): `GameScene`(배경/뷰포트), `GameObject`(좌표 배치), `PlayerCharacter`(사람 캐릭터 렌더), `MissionSign`(미션 표지판 NPC 오브젝트), `MovementControls`(방향 패드)
- **HomePage(`/`, 실천자 뷰)**: 통계 대시보드 → "내 집 앞" 게임 씬으로 전환. 집 앞마당에서 캐릭터를 이동 패드로 움직이고, 오늘의 미션을 표지판 카드로 표시(진행중/완료/검토중/반려 색상 구분), "마을 들어가기" CTA로 `/village` 이동
- **VillagePage(`/village`, 실천자 뷰)**: 마을 배경 위 자유 이동형 캐릭터, 배치된 장식/동물 주민을 GameObject로 표시, 상점·보유함·꾸미기·내 집(실내) 진입 버튼
- **HouseInteriorPage(`/village/house`, 신규)**: 집 내부 씬 — 침대/책상/책장/러그/창문 등 실내 가구를 배치해 표시, 캐릭터 이동 가능

### P3.3 구역(Zone) 기반 꾸미기 확장

- `VillagePlacement`에 `zone: 'HOUSE_EXTERIOR' | 'HOUSE_INTERIOR' | 'VILLAGE'` 필드 추가 (Supabase: `village_placements.zone`, 기본값 `'VILLAGE'`)
- `getZoneForSlot()`(`src/utils/villageRewards.ts`): `HOUSE` 슬롯 → `HOUSE_EXTERIOR`, `BED/DESK/BOOKSHELF/RUG/WINDOW` 슬롯(`INTERIOR` 포함) → `HOUSE_INTERIOR`, 그 외 → `VILLAGE`
- 신규 실내 장식 아이템: 침대 2종(`deco-bed-basic/cozy`), 러그 2종(`deco-rug-round/stripe`), 창문 2종(`deco-window-basic/curtain`)
- `VillageInventoryPage`/`VillageDecoratePage`는 zone별로 배치 위치를 분리해 보여주도록 확장

### P3.4 상점 — COSTUME 카테고리

- `VillageShopPage`의 `DecorationCategory`에 `COSTUME` 카테고리 추가 → `character_cosmetics` 카탈로그를 상점에서 구매 가능 (포인트 차감 → `user_cosmetics`에 추가)
- `VillageInventoryPage`에 `COSMETICS` / `ITEMS` / `RESIDENTS` 3개 탭 — 보유 의상은 탭에서 바로 장착/해제 가능

### P3.5 미션 보상 ↔ 캐릭터/마을 연결

- `villageStore.grantMissionReward(userId, mission, allMissions)` 결과(`MissionRewardSummary`)에 `cosmeticGained?`(코스튬 획득) 필드 추가 — 미션 유형 연계 확률 추첨 시 장식 아이템뿐 아니라 코스튬도 드랍 가능
- `ApprovalPage`/`MissionDetailPage`/`PerformerDetailPage` 3개 승인 플로우 모두에서 `grantMissionReward` 호출 + `SuccessAnimation`에 EXP/레벨업/아이템/코스튬/업적 결과를 멀티라인으로 표시하도록 통일
- `ProfilePage`/`ParentReportPage`에 사람 캐릭터 미리보기(`PlayerCharacter`) + 마을 레벨/경험치 카드 추가, `/character`로 이동하는 진입점 제공

### P3.6 라우트 추가

```
/village/house   HouseInteriorPage (집 내부)
/character       CharacterCustomizePage (캐릭터 꾸미기)
```

### P3.7 Supabase 마이그레이션

- `supabase/migrations/003_character_game_system.sql` (additive, 001/002 보존)
  - `village_placements.zone` 컬럼 추가
  - 기존 `decoration_items`의 책상/책장류 `slot`을 `DESK`/`BOOKSHELF`로 보정 + 침대/러그/창문 신규 아이템 insert
  - 신규 테이블: `character_cosmetics`(코스튬 카탈로그), `character_profiles`(유저당 1행, 외형+장착정보), `user_cosmetics`(보유 코스튬)
  - RLS `anon_all` 정책 추가, 코스튬/캐릭터 프로필/보유 코스튬 데모 시드 데이터 포함

---

## 0. 현재 코드베이스 분석 요약

먼저 재설계의 기준이 되는 현재 구조를 정리한다. (구현 시 비교 기준으로 계속 참조)

### 0.1 기술 스택

- **React 18 + TypeScript + Vite + TailwindCSS** (모바일 뷰포트 웹앱, `max-w-md` 단일 컬럼 레이아웃)
- **Zustand** (`persist` 미들웨어로 localStorage 캐싱) + **Supabase(Postgres)** 백엔드
  - 패턴: 로컬 state 먼저 갱신(낙관적 업데이트) → 백그라운드로 Supabase에 `update`/`insert` 푸시
  - RLS: 현재 모든 테이블에 `anon_all` (전체 허용) 정책 — 자체 로그인 방식이라 `auth.uid()` 미사용
- **react-router-dom**, **framer-motion**, `lucide-react` 아이콘

> ⚠️ 참고: 사용자 요청에는 "React Native"라고 표현되어 있으나, 실제 코드베이스는 **React 웹(Vite, 모바일 브라우저 대응 PWA형)**입니다. 본 기획서는 기존 웹 스택을 유지하는 것을 전제로 작성했습니다. RN 전환이 필요하면 별도의 마이그레이션 프로젝트로 분리해야 합니다.

### 0.2 데이터 모델 (`src/types/index.ts`)

| 모델 | 설명 |
|---|---|
| `User` | id, name, role(`PARENT/TEACHER/CHILD`), point, avatar, social 정보, facilitatorId, groupId, code, statusThresholds |
| `Mission` | title, description, rewardPoint, creatorId, assigneeId, status, submissionType, 기간, missionType, missionGoal, repeatType, parentShare |
| `MissionSubmission` | 제출 기록 (이미지/텍스트, attemptNumber) |
| `MissionReviewLog` | 승인/반려 로그 |
| `PointTransaction` | 포인트 증감 내역 (`MISSION_REWARD`, `MISSION_DEDUCT`, `AD_REWARD`, `COUPON_EXCHANGE`, `ADMIN_GRANT`, `ADMIN_DEDUCT`) |
| `Coupon` / `CouponExchange` | **상점 쿠폰 카탈로그 / 교환 기록 — 이번 재설계의 제거 대상** |
| `PerformerGroup` | 실천자 그룹(반) |
| `AdRewardLog` | 광고 시청 보상 로그 |
| `StatusThresholds` | 학생 상태(상담필요/주의 등) 분류 기준 (최근 추가됨, 진행자가 설정 가능) |

### 0.3 Supabase 테이블 (`supabase/schema.sql`)

`users`, `performer_groups`, `missions`, `mission_submissions`, `mission_review_logs`, `point_transactions`, `ad_reward_logs`, `coupons`, `coupon_exchanges`, `teacher_notes`, `mission_templates`. 모두 `text` PK(앱에서 생성한 ID), RLS는 `anon_all`.

### 0.4 Zustand 스토어

| 스토어 | 책임 |
|---|---|
| `authStore` | 사용자 목록/현재 사용자, 소셜 로그인, 연결 코드, viewMode(FACILITATOR/PERFORMER), statusThresholds, teacherNotes |
| `missionStore` | 미션 CRUD, 반복 미션 자동 생성, 제출/승인/반려, 리뷰 로그 |
| `pointStore` | 포인트 거래 내역(`PointTransaction`), 광고 시청 로그 |
| `shopStore` | **쿠폰 카탈로그 + 교환 — 제거 대상** |
| `groupStore` | 실천자 그룹(반) |
| `templateStore` | 미션 템플릿 |

### 0.5 화면/라우트 (`src/App.tsx`)

```
/                       HomePage (역할별 대시보드)
/missions               MissionListPage
/missions/create        MissionCreatePage
/missions/:id           MissionDetailPage
/missions/:id/edit      MissionEditPage
/missions/:id/submit    MissionSubmitPage
/approvals              ApprovalPage (리더 전용)
/performers             PerformerListPage (리더 전용)
/performers/:id         PerformerDetailPage
/students/:id           StudentDetailPage
/students/:id/report    ParentReportPage
/ranking                RankingPage
/shop                   ShopPage          ← 제거 대상
/shop/:id               CouponDetailPage  ← 제거 대상
/points                 PointHistoryPage
/profile                ProfilePage
/profile/status-settings StatusSettingsPage
```

### 0.6 핵심 흐름

- **미션 생명주기**: `IN_PROGRESS → REVIEWING → SUCCESS/REJECTED/(EXPIRED/FAILED)`
- **승인 시 보상**: `ApprovalPage.handleApprove()` → `approveMission()` (상태만 변경) + `updateUserPoint(assigneeId, +rewardPoint)` + `addTransaction(..., 'MISSION_REWARD', ...)` — **포인트 지급 로직이 화면 컴포넌트(ApprovalPage) 안에 있음**. 마을 성장 보상(경험치, 아이템)도 이 지점에 추가하는 것이 자연스러움.
- **상점**: `ShopPage` → 카테고리/검색 → `CouponCard` → `CouponDetailPage` → `exchangeCoupon()`(재고 차감) + `updateUserPoint(-cost)` + `addTransaction(..., 'COUPON_EXCHANGE', ...)`
- **통계**: `studentStats.ts` (완료율, 주간 수행률, 스트릭, 미제출, 상태 분류)
- **랭킹**: 포인트 순 정렬 + 그룹 필터 + 주간 수행률
- **보호자 리포트**: 주간 통계 카드 + 칭찬/관리포인트 + 리더 코멘트, 공유(`navigator.share`)

---

## 1. 새로운 서비스 컨셉

### 1.1 한 줄 정의

> "미션을 수행하면 내 마을이 자란다" — **학습/생활 습관 형성을 마을 육성 시뮬레이션으로 게임화한 서비스**

### 1.2 핵심 루프

```
[리더] 미션 생성
   ↓
[실천자] 미션 수행 → 인증 제출
   ↓
[리더] 승인
   ↓
[실천자] 포인트 + 경험치 획득
   │       ├─ 마을 레벨업 (새 건물/테마 해금)
   │       ├─ 미션 유형 연계 아이템 획득 (확률/조건부)
   │       └─ 업적/스트릭 달성 시 보너스
   ↓
[실천자] 포인트로 마을 꾸미기 상점에서 아이템 구매
   ↓
[실천자] 마을 꾸미기 (배치/교체) → 마을 성장 체감 → 다시 미션 수행 동기 부여
```

기존 "미션 → 포인트 → 현금성 쿠폰 교환"이라는 **소비형 루프**를, "미션 → 포인트/경험치 → 마을 성장/수집/꾸미기"라는 **축적·성장형 루프**로 전환한다. 리더/승인/통계/랭킹/보호자 리포트 등 **관리 기능은 그대로 유지**하되, 결과물(보상)의 의미를 마을 성장으로 재해석한다.

### 1.3 미션 유형 ↔ 마을 아이템 테마 매핑

기존 `MissionType` enum(`HOMEWORK | VOCABULARY | READING | ATTENDANCE | REVIEW_NOTES | LIFESTYLE | OTHER`)을 그대로 활용하여, 유형별로 어울리는 아이템 카테고리를 매핑한다.

| 미션 유형 | 라벨 | 연계 아이템 카테고리 | 대표 아이템 예시 |
|---|---|---|---|
| `HOMEWORK` | 숙제 | `STUDY_TOOL` | 책상, 스탠드 조명, 칠판, 계산기, 자, 각도기, 숫자 블록, 책가방, 과제 노트 |
| `VOCABULARY` | 단어암기 | `STUDY_TOOL`, `SCHOOL` | 단어 카드, 영어책, 알파벳 블록, 언어 연구소 |
| `READING` | 독서 | `HOUSE`, `FURNITURE` | 책장, 책더미, 독서 의자, 작은 도서관, 북카페, 책 읽는 동물 주민 |
| `ATTENDANCE` | 출석 | `SCHOOL` | 학교 건물, 교문, 출석 도장판, 교실, 시간표 |
| `REVIEW_NOTES` | 오답정리 | `STUDY_TOOL` | 노트, 지우개, 복습 책상, 문제풀이 게시판 |
| `LIFESTYLE` | 생활습관 | `TREE`/`FLOWER`/`PET` | 침대, 세면대, 정원, 화분, 산책로, 건강한 동물 친구 |
| `OTHER` | 기타 | (전체 카테고리에서 랜덤) | — |

이 매핑은 코드 상수(`src/utils/villageRewards.ts`)와 `decoration_items.unlock_mission_type` 컬럼으로 이중 관리한다 (카탈로그 필터링 + 보상 추첨에 사용).

---

## 2. 데이터 모델 설계

### 2.1 기존 모델 변경 사항

#### 제거

- `Coupon` 인터페이스 — **삭제**
- `CouponExchange` 인터페이스 — **삭제**
- `PointTransactionType`의 `'COUPON_EXCHANGE'` — **신규 거래에는 더 이상 사용하지 않음** (과거 이력 표시를 위해 타입 유니온에는 `'COUPON_EXCHANGE_LEGACY'`로 남기거나, 마이그레이션 시 `'DECORATION_PURCHASE'`로 일괄 변환)

#### 변경

- `PointTransactionType`에 추가:
  - `'DECORATION_PURCHASE'` — 마을 꾸미기 아이템 구매
  - `'EXP_REWARD'` — 별도 거래로 표시할 필요는 없으나, 포인트 내역 화면에 "경험치 획득" 항목을 함께 보여주기 위한 용도(선택)
- `User`에 추가 필드는 없음 — 마을 데이터는 `Village` 테이블에 1:1로 분리 (User 엔티티 비대화 방지, 실천자가 아닌 리더 계정과의 혼동 방지)

### 2.2 신규 모델

```typescript
// src/types/index.ts 에 추가

export type DecorationCategory =
  | 'HOUSE'        // 집
  | 'FURNITURE'    // 가구
  | 'TREE'         // 나무
  | 'FLOWER'       // 꽃
  | 'ROAD'         // 길
  | 'FENCE'        // 울타리
  | 'ANIMAL'       // 동물
  | 'PET'          // 펫
  | 'OUTFIT'       // 의상
  | 'THEME'        // 테마
  | 'STUDY_TOOL'   // 학습 도구
  | 'SCHOOL'       // 학교/도서관 건물
  | 'SEASONAL';    // 계절 한정 아이템

export type ItemRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export type AcquireSource = 'PURCHASE' | 'MISSION_REWARD' | 'ACHIEVEMENT' | 'STREAK' | 'EVENT' | 'LEVEL_UP';

export type AchievementConditionType =
  | 'MISSION_COUNT'        // 누적 성공 미션 수
  | 'MISSION_TYPE_COUNT'   // 특정 유형 누적 성공 수
  | 'STREAK'               // 연속 성공일
  | 'VILLAGE_LEVEL';       // 마을 레벨

export interface DecorationItem {
  id: string;
  name: string;
  description: string;
  emoji: string;
  imageUrl?: string;
  category: DecorationCategory;
  rarity: ItemRarity;
  requiredPoint: number;        // 상점 구매 가격 (0이면 구매 불가, 보상 전용)
  requiredLevel: number;        // 마을 레벨 해금 조건
  unlockMissionType?: MissionType; // 특정 미션 유형과 연계된 아이템 (드랍/추천 카탈로그용)
  width: number;                // 배치 그리드 가로 크기
  height: number;               // 배치 그리드 세로 크기
  enabled: boolean;
  isSeasonal: boolean;
  availableFrom?: string;
  availableUntil?: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  acquiredVia: AcquireSource;
  acquiredAt: string;
}

export interface Village {
  id: string;
  ownerId: string;       // CHILD(실천자) User.id, 1:1
  name: string;
  level: number;
  exp: number;
  theme: string;          // 적용중인 테마 decoration item id
  snapshotUrl?: string;   // 대표 이미지 (캡처/생성 이미지)
  createdAt: string;
  updatedAt: string;
}

export interface VillagePlacement {
  id: string;
  villageId: string;
  itemId: string;
  x: number;
  y: number;
  rotation: number;  // 0/90/180/270
  layer: number;      // 바닥(0) / 오브젝트(1) / 지붕·장식(2) 등
  placedAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  emoji: string;
  conditionType: AchievementConditionType;
  conditionValue: number;
  conditionMissionType?: MissionType; // MISSION_TYPE_COUNT일 때만 사용
  rewardPoint: number;
  rewardItemId?: string;
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}
```

### 2.3 마을 레벨/경험치 규칙 (제안)

- `expGain = max(10, round(mission.rewardPoint * 0.5))` — 미션 승인 시 포인트와 별도로 경험치 지급
- 레벨업 임계값: `levelThreshold(level) = level * 100` (레벨 1→2: 100exp, 2→3: 200exp, ...)
- `village.exp >= levelThreshold(village.level)` 이면 레벨업, 초과분 이월
- 레벨업 시: 보너스로 랜덤 장식 아이템 1개 지급 (레벨이 높을수록 `RARE` 이상 확률 ↑), 특정 레벨에서 새 카테고리 해금
  - Lv.2: `FENCE`, `FLOWER` 해금
  - Lv.3: `SCHOOL` 해금 (출석 미션 연계)
  - Lv.4: `PET` 해금
  - Lv.5: `THEME`(테마 변경) 해금
  - Lv.7+: `SEASONAL`(시즌 한정) 구매 가능

### 2.4 미션 승인 시 보상 알고리즘 (제안)

`ApprovalPage.handleApprove()` (또는 새로 만들 `villageStore.grantMissionReward()`)에서 다음을 순서대로 처리:

1. 기존: `updateUserPoint(+rewardPoint)`, `addTransaction('MISSION_REWARD')`
2. **신규**: `village.exp += expGain` → 레벨업 체크 → 레벨업 시 아이템/해금 처리
3. **신규**: `mission.missionType`에 해당하는 `unlockMissionType` 아이템 풀에서 확률 추첨(예: 30%) → 당첨 시 `inventory_items`에 추가 (`acquiredVia: 'MISSION_REWARD'`)
4. **신규**: `getStreak()` 결과가 마일스톤(3/7/14/30)에 도달하면 해당 업적 체크 → `user_achievements` insert + 보상 지급
5. **신규**: 누적 통계 기반 업적(`MISSION_COUNT`, `MISSION_TYPE_COUNT`, `VILLAGE_LEVEL`) 체크

---

## 3. 화면 구조 & 라우트 설계

### 3.1 라우트 변경표

| 기존 | 변경 후 | 비고 |
|---|---|---|
| `/shop` | `/village/shop` | `ShopPage` → `VillageShopPage`, 쿠폰→장식 아이템 |
| `/shop/:id` | `/village/shop/:id` | `CouponDetailPage` → `DecorationDetailPage` |
| *(신규)* | `/village` | 내 마을 메인 (실천자: 자기 마을 / 리더: 우리반 마을 목록) |
| *(신규)* | `/village/decorate` | 꾸미기 모드 (배치/이동/회전/제거) |
| *(신규)* | `/village/inventory` | 보유 아이템 목록 |
| *(신규)* | `/village/:userId` | 다른 사용자의 마을 보기 (읽기 전용 — 리더가 학생 마을 확인 / 또래 마을 방문) |
| *(신규, 확장)* | `/achievements` | 업적/도감 |
| 변경 없음 | `/`, `/missions*`, `/approvals`, `/performers*`, `/students/*`, `/ranking`, `/points`, `/profile*` | 그대로 유지 |

### 3.2 BottomNav 재설계

현재 `상점` 탭을 `마을` 탭으로 대체한다 (탭 개수/구조 변경 최소화):

```
실천자(PERFORMER) 모드: 홈 · 미션 · 랭킹 · 마을 · 내 정보
리더(FACILITATOR) 모드: 홈 · 미션 · 승인 · 실천자 · 마을(우리반) · 내 정보
```

- 실천자가 `/village` 진입 → 자신의 마을(`VillagePage`), 내부 탭: `[내 마을] [상점] [보유함]`
- 리더가 `/village` 진입 → 우리반 학생들의 마을 레벨/스냅샷을 카드 목록으로 보여주는 `VillageOverviewPage` → 카드 클릭 시 `/village/:studentId` (읽기 전용 보기)

### 3.3 화면별 상세

| 화면 | 설명 |
|---|---|
| **VillagePage** (`/village`) | 실천자 본인 마을. 상단: 마을 이름/레벨/경험치 바, 대표 스냅샷. 그리드 기반(또는 MVP에서는 카드형 레이아웃) 배치된 아이템 표시. "꾸미기" 버튼 → `/village/decorate` |
| **VillageDecoratePage** (`/village/decorate`) | 보유 아이템 목록에서 선택 → 그리드에 탭하여 배치 / 이동 / 회전 / 제거. 저장 시 `village_placements` upsert |
| **VillageShopPage** (`/village/shop`) | 기존 `ShopPage` 구조 재사용 (카테고리 탭, 검색, 교환 가능/불가 섹션) — 데이터만 `decoration_items`로 교체. 카테고리 = `DecorationCategory` |
| **DecorationDetailPage** (`/village/shop/:id`) | 기존 `CouponDetailPage` 구조 재사용 — "구매하기" 시 `inventory_items`에 추가 + 포인트 차감 |
| **VillageInventoryPage** (`/village/inventory`) | 보유 아이템 목록(수량, 획득 경로 표시), 배치 모드로 바로 진입 가능 |
| **VillageOverviewPage** (리더용 `/village`) | 우리반 학생별 마을 레벨/스냅샷 카드 목록, 클릭 시 읽기 전용 마을 보기 |
| **AchievementsPage** (`/achievements`, 확장) | 업적 목록(달성/미달성), 진행률 표시 |
| **RankingPage** (기존) | 포인트 랭킹에 "마을 레벨" 배지 추가 (예: `Lv.5 🏘️`) |
| **ParentReportPage** (기존) | "이번 주 마을 성장" 섹션 추가: 획득 경험치, 레벨업 여부, 새로 얻은 아이템 |
| **HomePage** (기존) | 실천자 뷰: "내 마을" 미리보기 카드 추가 (레벨/경험치 바 + 마을 바로가기). 리더 뷰: 기존 대시보드 유지 |

---

## 4. Supabase 테이블 설계

### 4.1 신규 테이블 (CREATE TABLE)

```sql
-- ── 마을 (실천자 1인당 1개) ───────────────────────────────
create table villages (
  id text primary key,
  owner_id text not null unique references users(id) on delete cascade,
  name text not null default '우리 마을',
  level integer not null default 1,
  exp integer not null default 0,
  theme text not null default 'default',
  snapshot_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── 장식 아이템 카탈로그 ───────────────────────────────────
create table decoration_items (
  id text primary key,
  name text not null,
  description text not null default '',
  emoji text not null default '🏠',
  image_url text,
  category text not null check (category in (
    'HOUSE','FURNITURE','TREE','FLOWER','ROAD','FENCE',
    'ANIMAL','PET','OUTFIT','THEME','STUDY_TOOL','SCHOOL','SEASONAL'
  )),
  rarity text not null default 'COMMON' check (rarity in ('COMMON','RARE','EPIC','LEGENDARY')),
  required_point integer not null default 0,
  required_level integer not null default 1,
  unlock_mission_type text check (unlock_mission_type in (
    'HOMEWORK','VOCABULARY','READING','ATTENDANCE','REVIEW_NOTES','LIFESTYLE','OTHER'
  )),
  width integer not null default 1,
  height integer not null default 1,
  enabled boolean not null default true,
  is_seasonal boolean not null default false,
  available_from timestamptz,
  available_until timestamptz,
  created_at timestamptz not null default now()
);

-- ── 보유 아이템 (인벤토리) ─────────────────────────────────
create table inventory_items (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  item_id text not null references decoration_items(id),
  quantity integer not null default 1,
  acquired_via text not null default 'PURCHASE' check (acquired_via in (
    'PURCHASE','MISSION_REWARD','ACHIEVEMENT','STREAK','EVENT','LEVEL_UP'
  )),
  acquired_at timestamptz not null default now()
);
create index inventory_items_user_idx on inventory_items(user_id);

-- ── 마을 배치 ──────────────────────────────────────────────
create table village_placements (
  id text primary key,
  village_id text not null references villages(id) on delete cascade,
  item_id text not null references decoration_items(id),
  x integer not null,
  y integer not null,
  rotation integer not null default 0,
  layer integer not null default 0,
  placed_at timestamptz not null default now()
);
create index village_placements_village_idx on village_placements(village_id);

-- ── 업적 카탈로그 ──────────────────────────────────────────
create table achievements (
  id text primary key,
  name text not null,
  description text not null default '',
  emoji text not null default '🏆',
  condition_type text not null check (condition_type in (
    'MISSION_COUNT','MISSION_TYPE_COUNT','STREAK','VILLAGE_LEVEL'
  )),
  condition_value integer not null,
  condition_mission_type text,
  reward_point integer not null default 0,
  reward_item_id text references decoration_items(id),
  created_at timestamptz not null default now()
);

-- ── 사용자별 업적 달성 기록 ─────────────────────────────────
create table user_achievements (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  achievement_id text not null references achievements(id),
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);
```

### 4.2 확장(Phase 2) 테이블 — 리텐션 기능용

```sql
-- 마을 방문 기록 (또래 마을 방문 + 응원 메시지/좋아요)
create table village_visits (
  id text primary key,
  village_id text not null references villages(id) on delete cascade,
  visitor_id text not null references users(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

-- 일일 출석/로그인 보상
create table daily_login_logs (
  id text primary key,
  user_id text not null references users(id) on delete cascade,
  reward_point integer not null default 0,
  reward_item_id text references decoration_items(id),
  logged_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, logged_date)
);
```

### 4.3 기존 테이블 변경

```sql
-- coupons / coupon_exchanges 제거 (point_transactions의 과거 'COUPON_EXCHANGE' 행은 보존)
drop table if exists coupon_exchanges cascade;
drop table if exists coupons cascade;
```

`point_transactions.type` 컬럼은 `text` (check 제약 없음)이므로 스키마 변경 불필요. 앱 코드에서 새 타입 `'DECORATION_PURCHASE'`을 사용하도록 변경하고, `txLabel`/`txColor`(`src/utils/helpers.ts`)에 다음을 추가:

```typescript
DECORATION_PURCHASE: '마을 꾸미기 구매 🏘️',
COUPON_EXCHANGE: '쿠폰 교환 🎁 (이전)', // 과거 이력 표시용으로 유지
```

### 4.4 RLS 정책

기존과 동일한 패턴(MVP 단계: anon 전체 허용)을 유지한다. 신규 테이블 모두 `schema.sql`의 RLS 루프 배열에 추가:

```sql
do $$
declare t text;
begin
  for t in select unnest(array[
    'users','performer_groups','missions','mission_submissions',
    'mission_review_logs','point_transactions','ad_reward_logs',
    'teacher_notes','mission_templates',
    'villages','decoration_items','inventory_items','village_placements',
    'achievements','user_achievements'
    -- Phase 2: 'village_visits','daily_login_logs'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all using (true) with check (true)', t);
  end loop;
end $$;
```

### 4.5 마이그레이션 절차 (실행 순서)

기존 패턴(이 세션 초반에 진행한 `status_thresholds` 컬럼 추가와 동일하게, **anon key로는 DDL 실행 불가** → 사용자가 Supabase SQL Editor에서 직접 실행)을 따른다.

1. **신규 테이블 생성** — 위 4.1 SQL 실행
2. **장식 아이템/업적 카탈로그 시드** — 아래 4.6 예시 데이터 insert
3. **기존 CHILD 사용자에 대해 `villages` 행 생성** (1인 1마을, level=1, exp=0)
   ```sql
   insert into villages (id, owner_id, name)
   select 'village-' || id, id, name || '의 마을'
   from users where role = 'CHILD'
   on conflict (owner_id) do nothing;
   ```
4. **coupons / coupon_exchanges 제거** — 4.3 SQL 실행 (앱 배포 이후, 더는 참조하지 않을 때)
5. (운영 중 신규 가입자는 앱 코드에서 `completeSocialRegistration`/마이그레이션 로직에 "마을 자동 생성" 추가)

### 4.6 초기 카탈로그 시드 예시 (일부)

```sql
insert into decoration_items (id, name, description, emoji, category, rarity, required_point, required_level, unlock_mission_type, width, height) values
('deco-desk',     '공부 책상',       '숙제할 때 필요한 튼튼한 책상이에요.', '🪑', 'STUDY_TOOL', 'COMMON', 80,  1, 'HOMEWORK', 1, 1),
('deco-board',    '칠판',            '오늘의 공부 계획을 적어보세요.',     '🖊️', 'STUDY_TOOL', 'COMMON', 100, 1, 'HOMEWORK', 1, 1),
('deco-bookshelf','책장',            '읽은 책을 가득 꽂아보세요.',         '📚', 'FURNITURE', 'COMMON', 90,  1, 'READING', 1, 1),
('deco-library',  '작은 도서관',     '독서왕이 되면 도서관을 지을 수 있어요.', '🏛️', 'SCHOOL', 'RARE', 400, 3, 'READING', 2, 2),
('deco-school',   '학교 건물',       '출석을 잘 하면 학교가 생겨요.',      '🏫', 'SCHOOL', 'RARE', 350, 3, 'ATTENDANCE', 2, 2),
('deco-flower',   '꽃밭',            '생활 습관을 잘 지키면 꽃이 피어요.', '🌷', 'FLOWER', 'COMMON', 50, 2, 'LIFESTYLE', 1, 1),
('deco-pet-dog',  '강아지 친구',     '꾸준한 친구가 마을에 놀러왔어요.',   '🐶', 'PET', 'EPIC', 0, 4, 'LIFESTYLE', 1, 1),
('deco-langlab',  '언어 연구소',     '단어 암기왕의 비밀 연구소.',         '🔬', 'SCHOOL', 'EPIC', 600, 5, 'VOCABULARY', 2, 2);

insert into achievements (id, name, description, emoji, condition_type, condition_value, condition_mission_type, reward_point, reward_item_id) values
('ach-first-mission', '첫 발걸음', '첫 미션을 완료했어요!', '🎉', 'MISSION_COUNT', 1, null, 50, 'deco-desk'),
('ach-streak-7',      '일주일 개근', '7일 연속 미션을 완료했어요!', '🔥', 'STREAK', 7, null, 100, 'deco-pet-dog'),
('ach-reading-10',    '독서왕', '독서 미션을 10번 완료했어요!', '📖', 'MISSION_TYPE_COUNT', 10, 'READING', 150, 'deco-library'),
('ach-village-5',     '마을 발전소', '마을 레벨 5를 달성했어요!', '🏘️', 'VILLAGE_LEVEL', 5, null, 0, 'deco-langlab');
```

---

## 5. 게임화 요소 강화 아이디어

1. **경험치 & 레벨업**: 미션 승인 시 포인트 + 경험치 동시 지급, 레벨업 연출(애니메이션) + 보상 모달
2. **미션 유형별 아이템 드랍**: 미션 승인 시 일정 확률로 해당 유형과 연계된 장식 아이템 획득 (희귀도에 따라 연출 차별화)
3. **스트릭 보상**: 기존 `getStreak()` 활용 — 3/7/14/30일 마일스톤 달성 시 보너스 아이템/포인트 + 업적 등록
4. **주간 챌린지**: "이번 주 미션 5개 이상 완료" 같은 자동 생성 챌린지 → 완료 시 한정 아이템 지급 (`HomePage`에 챌린지 카드 추가)
5. **업적/도감 시스템**: `achievements` + `user_achievements`, 달성률 표시, 도감 완성 보상
6. **희귀 아이템 추첨**: 레벨업/업적 보상에서 `COMMON~LEGENDARY` 가중치 추첨 (레벨이 높을수록 고급 등급 확률 ↑)
7. **주민 컬렉션**: `PET`/`ANIMAL` 카테고리를 특정 업적 달성으로만 해금 → 마을에 "주민"으로 등장
8. **테마 변경**: 레벨 5 이상에서 `THEME` 아이템 구매 시 마을 전체 배경/팔레트 변경
9. **시즌 한정 아이템**: `is_seasonal` + `available_from/until`로 크리스마스/할로윈 등 기간 한정 상점 노출

---

## 6. MVP vs 확장 버전

### 6.1 MVP (1차 출시 범위)

- [ ] Supabase 신규 테이블 (`villages`, `decoration_items`, `inventory_items`, `village_placements`, `achievements`, `user_achievements`) + 카탈로그 시드
- [ ] `Coupon`/`CouponExchange`/`shopStore`/`ShopPage`/`CouponDetailPage`/`CouponCard` 제거 또는 전환
- [ ] `villageStore`, `decorationStore` 신규
- [ ] **마을 꾸미기 상점** (`VillageShopPage`) — 기존 ShopPage UI 재사용, 카테고리=DecorationCategory
- [ ] **내 마을 화면** (`VillagePage`) — MVP에서는 자유 그리드 드래그 대신 **"카테고리별 슬롯에 보유 아이템 1개씩 배치"** 같은 단순화된 레이아웃으로 시작 가능 (구현 난이도/일정 고려)
- [ ] 미션 승인 시 **경험치 지급 + 레벨업** 로직
- [ ] 미션 유형별 아이템 드랍(확률) 로직
- [ ] 랭킹/보호자 리포트에 마을 레벨 노출
- [ ] BottomNav `상점` → `마을` 전환

### 6.2 확장 (2차 이후)

- [ ] 자유 좌표 그리드 기반 드래그 앤 드롭 배치 + 회전
- [ ] 업적/도감 화면 (`AchievementsPage`)
- [ ] 주민(Pet/Animal) 컬렉션 연출
- [ ] 테마 변경, 시즌 한정 아이템, 이벤트 배너
- [ ] 마을 방문(또래/리더) + 응원 메시지(`village_visits`)
- [ ] 일일 로그인 보상 + 출석 캘린더(`daily_login_logs`)
- [ ] 주간 챌린지 자동 생성
- [ ] 마을 스냅샷 자동 생성(캡처/공유)

---

## 7. 리텐션 전략 (아이들이 매일 접속하게 만들기)

| 전략 | 구현 아이디어 | 단계 |
|---|---|---|
| **일일 보상** | 앱 첫 접속 시 `daily_login_logs` 체크 → 출석 포인트/아이템 지급, 홈에 "오늘의 출석 체크" 카드 | 확장 |
| **스트릭** | 기존 `getStreak()` 기반 연속일 표시(불꽃 아이콘 + 숫자), 마일스톤 보상 | MVP(표시)/확장(보상 자동화) |
| **마을 방문** | 같은 그룹/리더 산하 또래 마을을 `/village/:userId`로 방문, "좋아요"/응원 메시지 남기기 | 확장 |
| **친구/또래 랭킹** | 기존 `RankingPage`에 마을 레벨 배지 추가, "이번 주 가장 많이 성장한 마을" 섹션 | MVP(레벨 표시)/확장(성장 랭킹) |
| **시즌 이벤트** | `is_seasonal` 아이템 + 기간 한정 미션 템플릿(`mission_templates`) 노출 | 확장 |
| **한정 아이템** | 레벨업/업적/스트릭 보상에 `LEGENDARY` 등급 한정 아이템 포함, 상점에서 구매 불가(획득 전용)로 희소성 부여 | MVP(카탈로그 설계)/확장(추첨 연출) |
| **알림/리마인드** | PWA 알림 권한 + "오늘 미제출 미션이 있어요" 푸시 (기존 미제출 통계 활용) | 확장 (별도 검토 필요) |

---

## 8. 파일 변경 목록

### 8.1 삭제

- `src/data/mockData.ts` 내 `initialCoupons` — 제거 (대신 `initialDecorationItems`, `initialAchievements` 추가)
- `src/store/shopStore.ts` — 삭제 (→ `decorationStore.ts`로 대체)
- `src/pages/ShopPage.tsx` — 삭제 (→ `VillageShopPage.tsx`)
- `src/pages/CouponDetailPage.tsx` — 삭제 (→ `DecorationDetailPage.tsx`)
- `src/components/shop/CouponCard.tsx` — 삭제 (→ `src/components/village/DecorationCard.tsx`)
- Supabase: `coupons`, `coupon_exchanges` 테이블 — 삭제 (마이그레이션 마지막 단계)

### 8.2 신규 생성

- `supabase/migrations/002_village_system.sql` — 4.1~4.6 SQL
- `src/store/villageStore.ts` — 마을 상태(레벨/경험치/배치), 보상 지급 로직
- `src/store/decorationStore.ts` — 장식 아이템 카탈로그 + 인벤토리 + 구매
- `src/utils/villageRewards.ts` — 레벨 임계값, 경험치 계산, 미션유형↔카테고리 매핑, 아이템 드랍 추첨, 업적 체크
- `src/pages/VillagePage.tsx` — 내 마을 (실천자) / 우리반 마을 목록 (리더)
- `src/pages/VillageDecoratePage.tsx` — 꾸미기 모드
- `src/pages/VillageShopPage.tsx` — 장식 상점 (구 ShopPage 구조 재사용)
- `src/pages/DecorationDetailPage.tsx` — 아이템 상세/구매 (구 CouponDetailPage 구조 재사용)
- `src/pages/VillageInventoryPage.tsx` — 보유 아이템
- `src/components/village/DecorationCard.tsx`
- `src/components/village/VillageGrid.tsx` (또는 MVP용 `VillageSlots.tsx`)
- `src/components/village/LevelUpModal.tsx`
- (확장) `src/pages/AchievementsPage.tsx`

### 8.3 수정

- `src/types/index.ts` — `Coupon`/`CouponExchange` 제거, `DecorationItem`/`InventoryItem`/`Village`/`VillagePlacement`/`Achievement`/`UserAchievement` 추가, `PointTransactionType`에 `DECORATION_PURCHASE` 추가
- `src/data/mockData.ts` — `initialCoupons` → `initialDecorationItems` + `initialAchievements`
- `src/utils/helpers.ts` — `txLabel`/`txColor`에 `DECORATION_PURCHASE` 추가, `COUPON_EXCHANGE`는 과거 이력 라벨로 유지
- `src/pages/ApprovalPage.tsx` — 승인 시 경험치/아이템/업적 보상 로직 호출 추가
- `src/components/layout/BottomNav.tsx` — `상점` → `마을` 탭 전환, 라우트 변경
- `src/App.tsx` — 라우트 추가/제거
- `src/pages/RankingPage.tsx` — 마을 레벨 배지 추가
- `src/pages/ParentReportPage.tsx` — "이번 주 마을 성장" 섹션 추가
- `src/pages/HomePage.tsx` — 실천자 뷰에 마을 미리보기 카드 추가
- `src/pages/PerformerListPage.tsx` / `PerformerDetailPage.tsx` — 마을 레벨 표시 (선택)
- `supabase/schema.sql` — 신규 테이블 반영, coupons/coupon_exchanges 제거 (최종 정리본)

---

## 9. 구현 순서 (승인 후 진행)

1. **마이그레이션 SQL** 작성 및 사용자 실행 안내 (`supabase/migrations/002_village_system.sql`)
2. **타입/데이터 모델** 코드 반영 (`types/index.ts`, `mockData.ts`, `helpers.ts`)
3. **Zustand 스토어** 추가/수정 (`villageStore`, `decorationStore`, `pointStore` 라벨)
4. **기존 Coupon/Shop 제거 → Decoration Shop 전환** (`VillageShopPage`, `DecorationDetailPage`, `DecorationCard`)
5. **Village 화면 추가** (`VillagePage`, `VillageDecoratePage`, `VillageInventoryPage`, BottomNav/App 라우팅)
6. **미션 완료 보상 로직 수정** (`ApprovalPage` → 경험치/레벨업/아이템 드랍/업적)
7. **랭킹/리포트에 마을 성장 정보 반영** (`RankingPage`, `ParentReportPage`, `HomePage`)
8. (확장) 업적 화면, 자유 배치 그리드, 마을 방문, 일일 보상, 시즌 이벤트

---

## 검토 요청 사항

승인 전 아래 항목에 대한 의견을 부탁드립니다.

1. **MVP 마을 화면의 배치 방식**: 자유 좌표 드래그앤드롭(개발 난이도 높음) vs. 카테고리별 슬롯/그리드(빠른 출시) — 6.1에서는 후자를 1차로 제안
2. **레벨/경험치 공식**(2.3): `expGain = rewardPoint * 0.5`, `levelThreshold = level * 100` 초기값 적정성
3. **아이템 드랍 확률**(2.4): 미션 승인 시 30% 확률 제안 — 너무 잦거나 드물지 않은지
4. **기존 쿠폰 데이터**: 운영 중인 쿠폰/교환 이력이 있다면 보존 방식(이력만 유지 vs 완전 삭제) 확인 필요
5. **`PARENT`/`TEACHER`(리더) 계정의 마을**: 리더도 자신의 마을을 가질지, 아니면 학생 마을 모아보기 전용 화면만 가질지

---

## Phase 4 — "진짜 생활 시뮬레이션 게임" 전환 (2026-06-12)

> 상태: **진행 중 (Claude 자율 진행, 추가 확인 없이 최선 판단으로 구현)**

Phase 2/3까지 SVG 에셋 라이브러리(인물/동물/집/마을 풍경)와 기본 이동(D-Pad)을 갖춘 GameScene 기반 화면을 완성했다. Phase 4는 다음 방향으로 한 단계 더 게임에 가깝게 다듬는다.

### 핵심 변경 — 이동 UX (완료)

- **방향키 버튼(D-Pad) UI 전면 금지** → `MovementControls.tsx` 삭제
- `src/hooks/usePlayerMovement.ts` 신규: 캐릭터 위치/방향(`facing`)/걷기(`walking`) 상태 + 경계 클램핑을 한 곳에서 관리
  - `move(dx, dy)`: 가상 조이스틱/키보드용 즉시 이동
  - `moveTo(xPct, yPct)`: 탭-이동(목적지까지 매 프레임 한 걸음씩 이동)
  - 키보드(WASD/방향키) 입력은 훅 내부에서 자체 처리 (UI 노출 없음)
- `src/components/game/VirtualJoystick.tsx` 신규: 화면 좌하단 반투명 원형 조이스틱 (pointer 이벤트, 누르는 동안 방향으로 이동, 떼면 자동 중앙 복귀)
- `GameScene`에 `onBackgroundTap?: (xPct, yPct) => void` 옵션 추가 (배경을 직접 탭했을 때만 발동, 자식 오브젝트 클릭과 충돌 없음) → 탭-이동에 사용
- `HomePage` / `VillagePage` / `HouseInteriorPage` 3곳 모두 `usePlayerMovement` + `VirtualJoystick` + `onBackgroundTap`으로 교체 완료, `npm run build` 통과

### 마을 화면 — 게임 월드 진입점 추가 (완료)

- `src/components/game/assets/ShopObject.tsx`(장터 가판대), `StorageChestObject.tsx`(보물상자) 신규 SVG
- `VillagePage` 씬 안에 상점/보유함을 실제 오브젝트로 배치해 탭하면 `/village/shop`, `/village/inventory`로 이동 (기존 하단 버튼은 보조 진입점으로 유지)

### 남은 작업 (다음 세션 우선순위)

1. **하우스/마을 꾸미기 인-씬 바텀시트**: 현재 `/village/decorate`는 별도 폼/리스트 페이지 — 게임 씬 하단에서 슬라이드업되는 바텀시트로 통합해 "관리 페이지" 느낌 제거
2. **동물 주민 4종 추가**: 오리/고슴도치/수달/사슴 — `residentSpecies.ts` SVG 추가 + `mockData.ts`의 `initialVillageResidents`/업적 보상 연계
3. **상점/보유함 화면 자체의 게임형 UX 개선**: 현재 리스트형 UI를 진열대/선반 비주얼로 점진 개선
4. **미션 보상 → 코스튬/주민/장식 드랍 연계 강화** (P3.5 항목의 실제 동작 점검 및 빈틈 보완)
5. **HomePage 잔여 이모지 정리**: `🌟`(빈 미션 배지), `🚶`(마을 전환 연출), `🧑`(프로필 없을 때 폴백), 정원/마당 장식 아이템(`gardenItem.emoji`/`yardItem.emoji`) — SVG 오브젝트로 점진 교체
