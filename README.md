# 미션 포인트 (Mission Point)

리더(보호자/선생님)가 실천자(자녀/학생)에게 미션을 부여하고, 실천자는 미션을 수행·인증하여 포인트를 모으고 쿠폰으로 교환하는 **미션 기반 동기부여 모바일 웹 앱**입니다.

## 1. 서비스 목적

- 가정이나 교육 현장에서 아이의 학습/생활 습관(숙제, 단어 암기, 독서, 출석, 오답정리 등)을 **미션 단위로 관리**하고, 완료 시 **포인트 보상**을 제공해 자기주도적 실천을 유도합니다.
- 리더(부모/선생님)는 여러 실천자를 그룹으로 관리하며, 미제출/완료율/상담 필요 여부 등 **현황을 한눈에 파악**할 수 있습니다.
- 실천자는 모은 포인트를 **상점의 쿠폰(편의점, 카페, 문화상품권 등)으로 교환**하거나, 광고 시청으로 추가 포인트를 적립할 수 있습니다.
- 보호자에게는 자녀의 미션 수행 결과를 **리포트 형태로 공유**할 수 있는 기능을 제공합니다.

## 2. 사용자 역할

| 역할 (내부 코드) | 화면 표기 | 설명 |
| --- | --- | --- |
| `PARENT` / `TEACHER` | **리더** | 미션을 생성/배정하고, 제출물을 승인·반려하며, 실천자 현황과 통계를 관리 |
| `CHILD` | **실천자** | 배정된 미션을 수행하고 사진/텍스트로 인증 제출, 포인트 적립·쿠폰 교환 |

- 한 계정은 "리더 모드"와 "실천자 모드(체험)"를 전환(`viewMode`)할 수 있습니다 (`CHILD` 역할은 항상 실천자 모드).
- 리더와 실천자는 **6자리 연결 코드**로 서로 연결되며(`connectByCode`), 실천자는 자신을 관리하는 리더(보호자/선생님)에게 귀속됩니다.
- 보호자에게 미션 결과를 공유하는 "보호자 리포트" 기능도 제공됩니다.

## 3. 주요 기능

### 미션 관리
- 미션 생성/수정 (제목, 설명, 보상 포인트, 제출 방식: 이미지/텍스트/둘 다, 기간, 반복 주기)
- 미션 유형(숙제/단어암기/독서/출석/오답정리/생활습관/기타) 및 미션 목표(성실도 향상, 학습 습관, 과제 제출 관리, 보호자 공유용 기록, 보상 이벤트) 분류
- 반복 미션(매일/매주/평일) 자동 생성
- 자주 쓰는 미션을 **템플릿**으로 저장해 재사용
- 미션 상태: `대기중 → 진행중 → 확인중(검토대기) → 성공/반려/실패/만료`

### 제출 & 승인
- 실천자는 사진/텍스트로 미션 수행 결과 제출
- 리더는 승인 화면에서 제출물을 검토 후 **승인(포인트 지급) / 반려(재제출 요청)** 처리, 반려 사유 코멘트 작성
- 기한이 지났는데 미제출인 미션은 자동으로 "미제출" 카운트에 집계

### 포인트 & 보상
- 미션 성공 시 보상 포인트 자동 지급
- 광고 시청(하루 최대 5회, 1회당 10P) 으로 추가 포인트 적립
- 리더 ↔ 실천자 간 포인트 직접 전송
- 포인트 적립/차감 내역 조회 (`PointHistoryPage`)

### 상점 / 쿠폰
- 편의점, 카페, 디저트, 문화상품권, 식사 등 카테고리별 쿠폰을 포인트로 교환
- 쿠폰 재고/활성화 여부 관리, 교환 내역 조회

### 실천자 관리 & 상태 분류
- 실천자를 그룹(반)으로 분류하여 관리, 그룹별 평균 수행률 확인
- 실천자별 완료율, 주간 수행률, 연속 성공 스트릭(streak), 미제출 건수 통계
- 실천자 상태를 5단계로 자동 분류:
  - **우수**: 완료율이 기준 이상인 실천자
  - **진행중**: 미션을 수행 중이거나 완료율이 보통 수준인 실천자
  - **미제출**: 기한이 지난 미제출 미션이 일정 개수 이상
  - **상담필요**: 미제출이 많거나 완료율이 매우 낮은 실천자
  - **대기**: 아직 배정된 미션이 없는 실천자
- 상태 분류 기준(미제출/상담필요 임계값, 우수 기준 완료율 등)은 리더가 `상태 기준 설정` 화면에서 직접 조정 가능
- 실천자별 메모(코멘트) 작성

### 랭킹
- 실천자 모드에서 또래 대비 포인트/수행률 랭킹 확인

### 보호자 공유
- 실천자별 미션 수행 리포트를 텍스트로 생성해 카카오톡 등으로 공유

### 로그인 / 온보딩
- Google, Kakao, Naver 소셜 로그인 (REST API 리다이렉트 방식)
- 최초 로그인 시 역할(리더/실천자) 선택 및 리더-실천자 연결
- API 키 없이 체험 가능한 **데모 계정** 제공

## 4. 화면 구성 (라우트)

| 경로 | 페이지 | 설명 |
| --- | --- | --- |
| `/` | HomePage | 리더/실천자 대시보드 |
| `/missions` | MissionListPage | 미션 목록 |
| `/missions/create` | MissionCreatePage | 미션 생성 |
| `/missions/:id` | MissionDetailPage | 미션 상세 |
| `/missions/:id/edit` | MissionEditPage | 미션 수정 |
| `/missions/:id/submit` | MissionSubmitPage | 미션 인증 제출 |
| `/approvals` | ApprovalPage | 제출물 승인/반려 (리더) |
| `/performers`, `/performers/:id` | PerformerListPage / PerformerDetailPage | 실천자 목록/상세 (리더) |
| `/students/:id` | StudentDetailPage | 실천자 상세 통계 |
| `/students/:id/report` | ParentReportPage | 보호자 공유 리포트 |
| `/ranking` | RankingPage | 랭킹 (실천자) |
| `/shop`, `/shop/:id` | ShopPage / CouponDetailPage | 상점 / 쿠폰 상세 |
| `/points` | PointHistoryPage | 포인트 내역 |
| `/profile` | ProfilePage | 내 정보 / 관리 통계 |
| `/profile/status-settings` | StatusSettingsPage | 실천자 상태 분류 기준 설정 |
| `/login`, `/register` | LoginPage / RoleSelectionPage | 로그인 / 역할 선택 |

## 5. 기술 스택

- **프레임워크**: React 18 + TypeScript + Vite
- **라우팅**: React Router v6
- **상태 관리**: Zustand (persist 미들웨어)
- **스타일**: Tailwind CSS, Framer Motion (애니메이션), lucide-react (아이콘)
- **백엔드**: Supabase (PostgreSQL) — 사용자, 미션, 제출물, 포인트, 그룹, 쿠폰 등 영속 데이터 저장
- **소셜 로그인**: Google OAuth (`@react-oauth/google`), Kakao / Naver (REST API 리다이렉트)
- **배포**: Vercel (Git 연동 자동 배포)

## 6. 프로젝트 구조

```
src/
├── App.tsx              # 라우팅 및 초기 데이터 로딩
├── pages/                # 화면 단위 컴포넌트
├── components/
│   ├── layout/           # AppLayout, Header, BottomNav
│   ├── mission/          # MissionCard 등
│   ├── shop/              # CouponCard 등
│   ├── ui/                # Button, Modal, Badge 등 공통 UI
│   └── animations/        # 코인/성공 애니메이션
├── store/                 # Zustand 스토어 (auth, mission, point, shop, group, template)
├── lib/                   # supabase 클라이언트, 소셜 로그인, 카카오 공유
├── utils/                 # 통계 계산, 라벨/포맷 헬퍼
├── data/                  # 데모 시드 데이터 (mockData)
└── types/                 # 공통 타입 정의
```

## 7. 시작하기

### 설치
```bash
npm install
```

### 환경 변수 설정
`.env.example`을 참고하여 `.env.local` 파일을 생성하고 아래 값을 채웁니다.

```bash
cp .env.example .env.local
```

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase 프로젝트 URL/anon key
- `VITE_GOOGLE_CLIENT_ID` — Google OAuth 클라이언트 ID
- `VITE_KAKAO_JS_KEY`, `VITE_KAKAO_REST_KEY` — 카카오 로그인/공유 키
- `VITE_NAVER_CLIENT_ID`, `VITE_NAVER_CALLBACK_URL` — 네이버 로그인 키/콜백 URL

소셜 로그인 키 없이도 **데모 체험하기**로 앱의 모든 기능을 둘러볼 수 있습니다.

### 개발 서버 실행
```bash
npm run dev
```

### 빌드 / 타입 체크
```bash
npm run build    # tsc + vite build
npm run preview  # 빌드 결과 미리보기
```

## 8. 데이터 모델 개요

- **User**: 역할(`PARENT`/`TEACHER`/`CHILD`), 포인트, 그룹, 연결 코드, 상태 분류 기준(`statusThresholds`) 등
- **Mission**: 제목/설명/보상 포인트, 담당자, 상태(`PENDING`~`EXPIRED`), 유형/목표/반복/보호자 공유 옵션
- **MissionSubmission / MissionReviewLog**: 제출물과 승인/반려 이력
- **PointTransaction / AdRewardLog**: 포인트 적립·차감 내역, 광고 시청 기록
- **Coupon / CouponExchange**: 상점 쿠폰과 교환 내역
- **PerformerGroup**: 실천자를 묶는 그룹(반)

모든 데이터는 Supabase에 저장되며, 최초 실행 시 `src/data/mockData.ts`의 데모 데이터가 자동으로 시드됩니다.