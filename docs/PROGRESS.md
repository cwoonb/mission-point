# 진행 상황 (PROGRESS)

## Phase 6 — Phaser 3 WebGL 마을 씬 체크리스트

| 항목 | 상태 | 비고 |
| --- | --- | --- |
| WebGL 캔버스 렌더링 (DOM/CSS 그리기 금지) | ✅ | `PhaserVillageCanvas.tsx` — `Phaser.Game` (AUTO→WebGL), 마을 화면은 전부 Phaser 캔버스 |
| 32px 타일맵 마을 (잔디/길/물 + 오브젝트 레이어 + 충돌) | ✅ | `VillageScene.ts` — 24×18 그리드(768×576px), `tile-grass`/`tile-path` 이미지 그리드 + 연못은 `TileSprite`, 충돌은 `staticGroup` rect |
| 카메라 추적 + 부드러운 이동 + 맵 경계 클램프 | ✅ | `cameras.main.startFollow(player, true, 0.1, 0.1)` + `setBounds(0,0,MAP_W,MAP_H)`, zoom 1.4 |
| 캐릭터 4방향 걷기+대기 애니메이션 | ✅ | `player-{down,up,side}-{a,b}` 텍스처 + `walk-*`/`idle-*` anims, 좌/우는 `side` + `flipX` |
| 동물 NPC idle 애니메이션 + 탭 대사 | ✅ | bob+wobble 트윈 + `pointerdown` → 말풍선 컨테이너(2.6s 자동 소멸) |
| 환경 애니메이션 ≥2 (물 반짝임, 나무 흔들림) | ✅ | `water.tilePositionX/Y` 흐름 + 나무 회전 트윈 |
| 파티클 효과 (미션완료/레벨업/배치/레어 반짝임) | ✅ | `playMissionCompleteEffect`/`playLevelUpEffect`/`playItemPlacedEffect`/`startRareShimmer` |
| 버튼 스케일-바운스 피드백 | ✅ | (Phase 5에서 적용) `Button.tsx` `active:scale-90` |
| 사운드 훅 구조 | ✅ | `src/utils/sound.ts` (Web Audio 비프 폴백 → 파일 경로 채우면 자동 전환), `Button` 탭/아이템배치/레벨업/코인에 연동 |
| 60fps 모바일 | ⚠️ 코드 리뷰로만 확인 | 절차적 텍스처 1회 생성 후 재사용, 타일 이미지 432장 + 소품/건물 10여 개 — Arcade Physics 기준 가벼운 씬. 실측은 브라우저 환경에서만 가능 |
| CC0 스프라이트 팩 + docs/ASSETS.md | ✅ (절차적 생성으로 대체) | 외부 팩 다운로드 도구 없음 → `palette.ts` 기반 절차적 생성, 출처/목록은 `docs/ASSETS.md` |
| 이모지/단순 도형 제거 | ✅ | Phaser 씬 내 모든 그래픽은 `Graphics` 벡터 도형, 이모지 없음 |
| 기존 미션/승인/포인트/상점/배치 데이터 흐름 보존 | ✅ | `VillagePage.tsx`는 동일한 store(`authStore`/`villageStore`/`decorationStore`/`characterStore`)를 그대로 사용, 렌더링 레이어만 교체 |

## v1 한계 — 페이지 간 파티클 이펙트 트리거

미션완료/레벨업 이펙트는 HomePage에서, 아이템 배치 이펙트는 VillageDecoratePage에서 발생하지만
Phaser 캔버스는 VillagePage에만 존재한다. 실시간 이벤트 버스 없이, 다음 방식으로 연결했다:

- `src/utils/villageEffects.ts` — `sessionStorage`에 마지막으로 본 `point`/`level`을 기록.
  VillagePage 진입(`onReady`) 시 이전 값과 비교해 증가했으면 레벨업/미션완료 이펙트+사운드 재생.
- 꾸미기 페이지에서 아이템을 배치하면 `markItemPlaced(userId)`로 플래그를 남기고,
  VillagePage 진입 시 이 플래그를 소비해 분수 근처에 "배치 팝" 이펙트를 1회 재생.
- 레어 아이템 반짝임(`startRareShimmer`)은 마을에 RARE 이상 등급 아이템이 배치되어 있으면
  씬 생성 시 항상 표시 (분수 위치, 지속 루프).

한계: 새로고침 후에는 `sessionStorage`가 유지되므로 동작하지만, 완전히 새 브라우저
세션에서는 "이전 값"이 없어 첫 진입 시 이펙트가 재생되지 않는다 (의도된 동작 — 최초 진입에서
오해를 주는 이펙트 방지). 추후 실시간 이벤트 버스나 알림함으로 고도화 가능.

## 다음 세션을 위한 메모

- `src/components/game/phaser/` 디렉터리가 Phaser 마을 씬의 전부: `VillageScene.ts`(씬 본체),
  `textures.ts`/`buildings.ts`(절차적 텍스처), `events.ts`(React↔Phaser 브릿지),
  `PhaserVillageCanvas.tsx`(React 래퍼).
- HomePage/HouseInteriorPage는 여전히 Phase 5 SVG 2D 코지 아트(안전한 기존 베이스라인) —
  Phaser 전환 대상이 아님 (`docs/redesign-plan.md` Phase 6 참고).
- 풀 3D 전환 관련 스코프 결정은 `docs/DECISIONS.md` 2번 참고.
