# 에셋 출처 (ASSETS)

마을 Phaser 씬(`src/components/game/phaser/`)에서 사용하는 모든 타일/스프라이트/소품/파티클
텍스처는 외부 CC0 에셋 팩을 다운로드할 수 있는 도구가 없어, **코드 내에서 절차적으로 생성**한다.

- 생성 로직: `src/components/game/phaser/textures.ts`, `src/components/game/phaser/buildings.ts`
- 색상 출처: `src/components/game/assets/palette.ts` (Phase 5에서 정립한 2D 코지 아트 팔레트)
  및 `shade()`/`tint()` 명암 헬퍼 — 기존 SVG 에셋과 동일한 색감/셰이딩 규칙을 그대로 재사용한다.
- 생성 방식: `Phaser.GameObjects.Graphics`로 도형을 그린 뒤 `generateTexture(key, w, h)`로
  텍스처를 만들고 그래픽스 객체는 파기한다 (`tex()` 헬퍼, `textures.ts`).
- 외부 라이선스 파일 없음 — 모든 텍스처는 자체 제작 벡터 도형이며, 라이선스 제약이 없다.

## 생성되는 텍스처 목록

| 텍스처 키 | 크기(px) | 설명 |
| --- | --- | --- |
| `player-{down,up,side}-{a,b}` | 40×52 | 캐릭터 4방향 × 걷기 2프레임 (좌/우는 `side`를 `flipX`로 재사용) |
| `npc-{species}` | 44×44 | 동물 주민 (rabbit/squirrel/beaver/fox/cat/dog/bear/panda/penguin/owl) |
| `tile-grass` | 32×32 | 잔디 타일 (얼룩무늬 음영 포함) |
| `tile-path` | 32×32 | 흙길 타일 |
| `tile-water` | 32×32 | 연못 타일 — `TileSprite`로 사용해 `tilePositionX/Y` 애니메이션으로 반짝임 표현 |
| `tree` | 56×68 | 나무 — 회전 트윈(origin 0.5, 0.97)으로 흔들림 표현 |
| `building-house` / `building-house-tier-{1,2,3}` | 80×76 (등급별 1/1.06/1.15배) | 집 — `HouseRenderer`의 등급별 색상(`TIER_COLORS`)과 동일 |
| `building-shop` | 68×64 | 상점 |
| `building-library` | 70×66 | 도서관 |
| `building-school` | 76×70 | 학교 |
| `building-storage` | 48×46 | 보유함(창고) |
| `prop-fountain` | 48×40 | 분수 |
| `prop-mailbox` | 28×40 | 우체통 |
| `prop-bench` | 56×30 | 벤치 |
| `prop-fence` | 40×36 | 울타리 (현재 맵 경계는 충돌 영역으로만 처리, 텍스처는 예비) |
| `prop-flower-{pink,white,purple,yellow}` | 24×24 | 꽃 4색상 |
| `particle-sparkle` | 16×16 | 8각 반짝이 — 미션완료/레어 아이템 이펙트 |
| `particle-star` | 14×14 | 8각 별 — 레벨업 이펙트 |
| `particle-dot` | 8×8 | 흰 점 — 아이템 배치 팝 이펙트 |

## 사운드

`src/utils/sound.ts` — 사운드 파일이 준비되기 전까지는 Web Audio 오실레이터로 가벼운 비프음을
재생한다. `SOUND_FILES`에 `/sounds/*.mp3` 등의 경로를 추가하면 해당 키부터 자동으로 파일
재생으로 전환되며, 별도 코드 수정은 필요 없다.
