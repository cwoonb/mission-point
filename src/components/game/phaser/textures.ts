import Phaser from 'phaser';
import { palette, shade, tint } from '../assets/palette';

/** '#RRGGBB' → 0xRRGGBB */
function n(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

type Col = string | number;
function col(c: Col): number {
  return typeof c === 'number' ? c : n(c);
}

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** 정수 좌표 하드엣지 픽셀 블록 — 픽셀아트의 핵심 (안티에일리어싱 없는 각진 면) */
function px(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c: Col, alpha = 1) {
  g.fillStyle(col(c), alpha);
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** 결정적 의사난수 — 타일 변형에 사용 */
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export interface PlayerColors {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
}

/** 동물 주민 종(species)별 몸 색상 */
export const ANIMAL_BODY: Record<string, string> = {
  rabbit: '#F5E6D8',
  squirrel: '#C98A52',
  beaver: '#8A5A36',
  fox: '#E8884A',
  cat: '#D9A66C',
  dog: '#C98A52',
  bear: '#8A5A36',
  panda: '#FFFFFF',
  penguin: '#3A3A4A',
  owl: '#B08968',
};

// ───────────────────────────────────────────────────────────
//  캐릭터 (밀짚모자 농부, 4방향 × 걷기 2프레임)
// ───────────────────────────────────────────────────────────

/** 농부 한 프레임을 블록 픽셀로 그린다. legPhase로 걷기 바운스 표현 */
function drawCharBody(g: Phaser.GameObjects.Graphics, colors: PlayerColors, facing: 'down' | 'up' | 'side', legPhase: 0 | 1) {
  const { skin, hair, top, bottom, shoes } = colors;
  const topD = shade(top, 0.2);
  const topH = tint(top, 0.18);
  const skinD = shade(skin, 0.14);
  const botD = shade(bottom, 0.2);
  const hatL = palette.strawHat;
  const hatD = palette.strawHatDark;
  const band = palette.strawBand;
  const up = legPhase === 0 ? -1 : 1;
  const dn = legPhase === 0 ? 1 : -1;

  // 바닥 그림자 (납작한 타원 대신 계단형 블록)
  px(g, 12, 47, 16, 3, 0x3a2c20, 0.18);
  px(g, 14, 49, 12, 2, 0x3a2c20, 0.12);

  // ── 다리 + 신발 ──
  px(g, 15, 35 + up, 4, 9, bottom); // 왼다리
  px(g, 15, 35 + up, 1, 9, botD, 0.5);
  px(g, 21, 35 + dn, 4, 9, bottom); // 오른다리
  px(g, 24, 35 + dn, 1, 9, botD, 0.5);
  px(g, 14, 44 + up, 6, 3, shoes); // 왼신발
  px(g, 21, 44 + dn, 6, 3, shoes); // 오른신발
  px(g, 14, 44 + up, 6, 1, tint(shoes, 0.25), 0.6);
  px(g, 21, 44 + dn, 6, 1, tint(shoes, 0.25), 0.6);

  // ── 몸통(셔츠) ──
  px(g, 12, 21, 16, 15, top);
  px(g, 12, 21, 16, 2, topH, 0.6); // 상단 하이라이트
  px(g, 12, 33, 16, 3, topD, 0.5); // 하단 그림자
  if (facing === 'side') {
    // 옆: 팔 하나만 앞으로
    px(g, 18, 23 + dn, 5, 12, top);
    px(g, 18, 23 + dn, 5, 2, topH, 0.5);
    px(g, 21, 33 + dn, 4, 4, skin); // 손
  } else {
    px(g, 9, 23 + dn, 4, 12, top); // 왼팔
    px(g, 27, 23 + up, 4, 12, top); // 오른팔
    px(g, 9, 33 + dn, 4, 4, skin); // 왼손
    px(g, 27, 33 + up, 4, 4, skin); // 오른손
  }

  // ── 머리 ──
  if (facing === 'up') {
    // 뒤통수: 머리카락
    px(g, 13, 9, 14, 12, hair);
    px(g, 13, 9, 14, 3, tint(hair, 0.2), 0.5);
  } else {
    px(g, 13, 10, 14, 11, skin); // 얼굴
    px(g, 24, 12, 3, 8, skinD, 0.4); // 얼굴 우측 음영
    // 머리카락 (이마 라인)
    px(g, 13, 10, 14, 2, hair);
    if (facing === 'side') {
      px(g, 13, 10, 5, 9, hair); // 옆머리
    }
  }

  // ── 밀짚모자 ──
  // 챙 (넓은 블록)
  px(g, 9, 8, 22, 3, hatL);
  px(g, 9, 8, 22, 1, tint(hatL, 0.2), 0.7);
  px(g, 9, 10, 22, 1, hatD, 0.6);
  // 윗부분(크라운)
  px(g, 14, 2, 12, 7, hatL);
  px(g, 14, 2, 12, 2, tint(hatL, 0.18), 0.7);
  px(g, 23, 3, 3, 6, hatD, 0.5);
  // 밴드
  px(g, 14, 6, 12, 2, band);

  // ── 얼굴 디테일 ──
  if (facing === 'down') {
    px(g, 16, 14, 2, 2, palette.ink); // 왼눈
    px(g, 22, 14, 2, 2, palette.ink); // 오른눈
    px(g, 15, 17, 2, 1, '#FDA4AF', 0.7); // 볼터치
    px(g, 23, 17, 2, 1, '#FDA4AF', 0.7);
    px(g, 19, 17, 2, 1, skinD, 0.5); // 입
  } else if (facing === 'side') {
    px(g, 22, 14, 2, 2, palette.ink); // 한쪽 눈
    px(g, 24, 17, 2, 1, '#FDA4AF', 0.7);
  }
}

/** 플레이어 4방향(아래/위/옆) × 걷기 2프레임 텍스처 생성 (좌/우는 side를 flipX로 재사용) */
export function generatePlayerTextures(scene: Phaser.Scene, colors: PlayerColors) {
  (['down', 'up', 'side'] as const).forEach((facing) => {
    (['a', 'b'] as const).forEach((frame, i) => {
      tex(scene, `player-${facing}-${frame}`, 40, 52, (g) => drawCharBody(g, colors, facing, i as 0 | 1));
    });
  });
}

// ───────────────────────────────────────────────────────────
//  동물 주민 (블록 픽셀)
// ───────────────────────────────────────────────────────────
export function generateAnimalTexture(scene: Phaser.Scene, species: string) {
  const key = `npc-${species}`;
  if (scene.textures.exists(key)) return key;
  const body = ANIMAL_BODY[species] ?? palette.wood;
  const light = tint(body, 0.22);
  const dark = shade(body, 0.18);
  tex(scene, key, 44, 44, (g) => {
    px(g, 12, 40, 20, 3, 0x3a2c20, 0.18); // 그림자
    // 몸통
    px(g, 14, 26, 16, 12, body);
    px(g, 14, 26, 16, 2, light, 0.6);
    px(g, 14, 34, 16, 3, dark, 0.4);
    // 발
    px(g, 16, 37, 4, 3, dark, 0.7);
    px(g, 24, 37, 4, 3, dark, 0.7);
    // 귀
    px(g, 12, 7, 6, 8, body);
    px(g, 26, 7, 6, 8, body);
    px(g, 13, 8, 3, 5, dark, 0.4);
    px(g, 27, 8, 3, 5, dark, 0.4);
    // 머리
    px(g, 12, 12, 20, 16, body);
    px(g, 12, 12, 20, 3, light, 0.6);
    px(g, 27, 14, 4, 12, dark, 0.35);
    // 볼터치
    px(g, 14, 22, 3, 2, '#FDA4AF', 0.6);
    px(g, 27, 22, 3, 2, '#FDA4AF', 0.6);
    // 눈
    px(g, 17, 18, 3, 3, palette.ink);
    px(g, 24, 18, 3, 3, palette.ink);
    px(g, 18, 18, 1, 1, 0xffffff, 0.9);
    px(g, 25, 18, 1, 1, 0xffffff, 0.9);
    // 코
    px(g, 21, 22, 2, 2, palette.ink, 0.85);
  });
  return key;
}

// ───────────────────────────────────────────────────────────
//  지면 타일 (잔디 변형 / 모랫길 / 갈은 밭 / 물)
// ───────────────────────────────────────────────────────────
export function generateTileTextures(scene: Phaser.Scene) {
  // 잔디 3종 변형 — 타일 반복 시 패턴이 티 나지 않도록
  [0, 1, 2].forEach((v) => {
    const base = v === 1 ? palette.grassB : palette.grassA;
    tex(scene, v === 0 ? 'tile-grass' : `tile-grass-${v + 1}`, 32, 32, (g) => {
      px(g, 0, 0, 32, 32, base);
      const r = rng(v * 97 + 13);
      // 어두운 풀잎
      for (let i = 0; i < 7; i++) {
        const x = Math.floor(r() * 30);
        const y = Math.floor(r() * 30);
        px(g, x, y, 2, 3, palette.grassBlade, 0.6);
      }
      // 밝은 하이라이트 점
      for (let i = 0; i < 5; i++) {
        const x = Math.floor(r() * 31);
        const y = Math.floor(r() * 31);
        px(g, x, y, 2, 2, palette.grassHi, 0.5);
      }
    });
  });

  // 모랫길 (스타듀 흙길 톤)
  tex(scene, 'tile-path', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, palette.pathSand);
    const r = rng(71);
    for (let i = 0; i < 10; i++) {
      const x = Math.floor(r() * 30);
      const y = Math.floor(r() * 30);
      px(g, x, y, 2, 2, palette.pathSandDark, 0.55);
    }
    for (let i = 0; i < 6; i++) {
      const x = Math.floor(r() * 30);
      const y = Math.floor(r() * 30);
      px(g, x, y, 2, 1, palette.pathSandHi, 0.6);
    }
  });

  // 갈은 밭 — 가로 이랑(furrow)
  tex(scene, 'tile-soil', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, palette.soil);
    for (let row = 0; row < 4; row++) {
      const y = row * 8;
      px(g, 0, y, 32, 1, palette.soilHi, 0.5); // 이랑 윗면 광
      px(g, 0, y + 6, 32, 2, palette.soilDark, 0.55); // 고랑 그림자
    }
    const r = rng(33);
    for (let i = 0; i < 6; i++) px(g, Math.floor(r() * 30), Math.floor(r() * 30), 1, 1, palette.soilDark, 0.5);
  });

  // 물
  tex(scene, 'tile-water', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, palette.water);
    px(g, 0, 18, 32, 14, palette.waterDeep, 0.4);
    px(g, 2, 5, 12, 1, palette.waterFoam, 0.7);
    px(g, 18, 9, 10, 1, palette.waterFoam, 0.6);
    px(g, 6, 22, 14, 1, palette.waterFoam, 0.5);
    px(g, 20, 26, 8, 1, palette.waterFoam, 0.5);
  });
}

// ───────────────────────────────────────────────────────────
//  작물 (밭 위에 얹는 스프라이트, 투명 배경)
// ───────────────────────────────────────────────────────────
export function generateCropTextures(scene: Phaser.Scene) {
  const leaf = palette.cropLeaf;
  const leafD = palette.cropLeafDark;
  const leafH = palette.cropLeafHi;

  // 자라는 새싹
  tex(scene, 'crop-a', 32, 32, (g) => {
    px(g, 15, 20, 2, 8, leafD); // 줄기
    px(g, 11, 18, 4, 3, leaf);
    px(g, 17, 16, 5, 3, leaf);
    px(g, 13, 14, 3, 3, leafH, 0.8);
  });

  // 잎이 무성한 작물
  tex(scene, 'crop-b', 32, 32, (g) => {
    px(g, 15, 20, 2, 8, leafD);
    px(g, 9, 16, 6, 5, leafD);
    px(g, 17, 16, 6, 5, leafD);
    px(g, 11, 13, 5, 5, leaf);
    px(g, 16, 12, 6, 6, leaf);
    px(g, 13, 11, 4, 3, leafH, 0.8);
  });

  // 열매 달린 작물
  tex(scene, 'crop-c', 32, 32, (g) => {
    px(g, 15, 20, 2, 8, leafD);
    px(g, 9, 15, 7, 6, leafD);
    px(g, 16, 15, 7, 6, leafD);
    px(g, 11, 12, 6, 5, leaf);
    px(g, 16, 11, 6, 6, leaf);
    px(g, 13, 10, 4, 3, leafH, 0.8);
    px(g, 12, 19, 3, 3, palette.cropFruit); // 열매
    px(g, 18, 18, 3, 3, palette.cropFruit);
    px(g, 12, 19, 1, 1, '#FFD9C2', 0.8);
  });
}

export const CROP_KEYS = ['crop-a', 'crop-b', 'crop-c'] as const;

// ───────────────────────────────────────────────────────────
//  나무 (스타듀 오크풍 — 갈색 줄기 + 층층 캐노피)
// ───────────────────────────────────────────────────────────
export function generateTreeTexture(scene: Phaser.Scene) {
  tex(scene, 'tree', 56, 72, (g) => {
    px(g, 16, 66, 24, 4, 0x3a2c20, 0.18); // 그림자
    // 줄기
    px(g, 24, 44, 8, 24, palette.trunkDark);
    px(g, 24, 44, 3, 24, palette.trunk);
    px(g, 22, 60, 12, 4, palette.trunkDark); // 뿌리 밑동
    // 캐노피 (블록 덩어리 3겹)
    px(g, 12, 22, 32, 24, palette.leafDark);
    px(g, 8, 28, 40, 14, palette.leafDark);
    px(g, 14, 16, 28, 10, palette.leafDark);
    px(g, 14, 24, 28, 18, palette.leafMid);
    px(g, 10, 30, 36, 10, palette.leafMid);
    px(g, 16, 18, 22, 8, palette.leafMid);
    px(g, 16, 24, 20, 10, palette.leafLight, 0.85); // 하이라이트
    px(g, 18, 20, 12, 5, palette.leafLight, 0.9);
    // 어두운 잎 사이 틈
    px(g, 22, 34, 4, 3, palette.leafDark, 0.7);
    px(g, 32, 30, 3, 3, palette.leafDark, 0.6);
  });
}

// ───────────────────────────────────────────────────────────
//  건물 (통나무 오두막 / 빨간 헛간)
// ───────────────────────────────────────────────────────────
interface BuildingSpec {
  key: string;
  w: number;
  h: number;
  roof: string;
  wall: string;
  barn?: boolean;
}

export function generateBuildingTexture(scene: Phaser.Scene, spec: BuildingSpec) {
  const { key, w, h, roof, wall, barn } = spec;
  tex(scene, key, w, h, (g) => {
    const roofH = Math.round(h * 0.44);
    const wallTop = roofH - 2;
    const inset = 3;
    const wallH = h - wallTop - 2;

    px(g, inset, h - 3, w - inset * 2, 3, 0x3a2c20, 0.16); // 그림자

    // ── 벽 ──
    px(g, inset, wallTop, w - inset * 2, wallH, wall);
    if (barn) {
      // 헛간: 빨간 판자 + 흰 트림
      for (let x = inset; x < w - inset; x += 6) px(g, x, wallTop, 1, wallH, palette.barnRedDark, 0.5);
      px(g, inset, wallTop, w - inset * 2, 3, palette.barnRedHi, 0.5);
      px(g, inset, wallTop, w - inset * 2, 2, '#F4ECE0'); // 흰 트림 상단
      px(g, inset, h - 5, w - inset * 2, 2, '#F4ECE0');
      // 큰 문 + 흰 X
      const dw = Math.round(w * 0.4);
      const dx = Math.round(w / 2 - dw / 2);
      const dh = Math.round(wallH * 0.62);
      const dy = h - 3 - dh;
      px(g, dx, dy, dw, dh, palette.shingleDark);
      px(g, dx, dy, dw, 2, '#F4ECE0');
      px(g, Math.round(w / 2 - 1), dy, 2, dh, '#F4ECE0'); // 세로
      for (let i = 0; i < dh; i++) {
        const t = i / dh;
        px(g, Math.round(dx + t * (dw - 2)), dy + i, 2, 1, '#F4ECE0', 0.9);
        px(g, Math.round(dx + (1 - t) * (dw - 2)), dy + i, 2, 1, '#F4ECE0', 0.9);
      }
    } else {
      // 오두막: 세로 판자 결 + 하단 음영
      for (let x = inset; x < w - inset; x += 5) px(g, x, wallTop, 1, wallH, shade(wall, 0.12), 0.5);
      px(g, inset, wallTop, w - inset * 2, 2, tint(wall, 0.18), 0.6);
      px(g, inset, h - 5, w - inset * 2, 3, shade(wall, 0.14), 0.4);
      // 문
      const dw = Math.round(w * 0.24);
      const dx = Math.round(w / 2 - dw / 2);
      const dh = Math.round(wallH * 0.6);
      const dy = h - 3 - dh;
      px(g, dx, dy, dw, dh, palette.shingle);
      px(g, dx, dy, 2, dh, palette.shingleHi, 0.6);
      px(g, dx, dy, dw, dh, palette.shingleDark, 0); // noop keep
      px(g, Math.round(w / 2 + dw / 2) - 3, Math.round(dy + dh / 2), 2, 2, palette.strawHat); // 손잡이
      // 창문 2개
      const ws = Math.max(7, Math.round(w * 0.16));
      const wy = wallTop + 5;
      [inset + 4, w - inset - 4 - ws].forEach((wx) => {
        px(g, wx, wy, ws, ws, '#BFE3F2');
        px(g, wx, wy, ws, Math.round(ws / 2), '#D8F0FA', 0.7);
        px(g, wx + Math.round(ws / 2), wy, 1, ws, shade(wall, 0.2));
        px(g, wx, wy + Math.round(ws / 2), ws, 1, shade(wall, 0.2));
        // 창틀
        px(g, wx - 1, wy - 1, ws + 2, 1, palette.shingle);
        px(g, wx - 1, wy + ws, ws + 2, 1, palette.shingle);
      });
    }

    // ── 지붕 (계단형 픽셀 박공 + 너와 결) ──
    const eave = 3;
    for (let yy = 0; yy < roofH; yy++) {
      const t = roofH <= 1 ? 1 : yy / (roofH - 1);
      const half = Math.round((w / 2 + eave) * t);
      const x0 = Math.round(w / 2 - half);
      const rw = half * 2;
      const bandDark = Math.floor(yy / 3) % 2 === 1;
      px(g, x0, yy, rw, 1, bandDark ? shade(roof, 0.14) : roof);
    }
    // 지붕 처마 그림자 + 용마루 하이라이트
    px(g, Math.round(w / 2 - (w / 2 + eave)) , roofH - 1, w + eave * 2, 1, shade(roof, 0.22), 0.6);
    px(g, Math.round(w / 2 - 1), 1, 3, Math.round(roofH * 0.5), tint(roof, 0.2), 0.6);
    // 굴뚝
    if (!barn) {
      px(g, Math.round(w * 0.68), Math.round(roofH * 0.3), 5, Math.round(roofH * 0.5), palette.shingle);
      px(g, Math.round(w * 0.68), Math.round(roofH * 0.3), 5, 2, palette.shingleHi, 0.7);
    }
  });
}

// ───────────────────────────────────────────────────────────
//  소품 (분수 / 우체통 / 벤치 / 울타리 / 꽃)
// ───────────────────────────────────────────────────────────
export function generatePropTextures(scene: Phaser.Scene) {
  tex(scene, 'prop-fountain', 48, 40, (g) => {
    px(g, 8, 36, 32, 3, 0x3a2c20, 0.16);
    px(g, 6, 24, 36, 12, palette.stoneDark); // 받침
    px(g, 8, 22, 32, 11, palette.stone);
    px(g, 8, 22, 32, 2, tint(palette.stone, 0.2), 0.6);
    px(g, 12, 25, 24, 7, palette.water); // 물
    px(g, 12, 25, 24, 2, palette.waterFoam, 0.7);
    px(g, 22, 8, 4, 16, palette.stone); // 기둥
    px(g, 22, 8, 1, 16, tint(palette.stone, 0.3), 0.7);
    px(g, 18, 6, 12, 3, palette.stone); // 윗접시
    px(g, 20, 9, 8, 1, palette.water, 0.8);
  });

  tex(scene, 'prop-mailbox', 28, 40, (g) => {
    px(g, 8, 37, 14, 3, 0x3a2c20, 0.16);
    px(g, 12, 16, 4, 22, palette.fenceWoodDark); // 기둥
    px(g, 12, 16, 1, 22, palette.fenceWood);
    px(g, 4, 8, 20, 12, palette.roofRed); // 박스
    px(g, 4, 8, 20, 3, tint(palette.roofRed, 0.22), 0.6);
    px(g, 4, 17, 20, 3, shade(palette.roofRed, 0.18), 0.4);
    px(g, 22, 9, 4, 8, '#F4ECE0'); // 깃발
    px(g, 6, 12, 5, 5, '#3A2C20', 0.5); // 입구
  });

  tex(scene, 'prop-bench', 56, 30, (g) => {
    px(g, 10, 27, 38, 3, 0x3a2c20, 0.16);
    px(g, 9, 8, 4, 18, palette.fenceWoodDark); // 다리
    px(g, 43, 8, 4, 18, palette.fenceWoodDark);
    px(g, 6, 4, 44, 5, palette.wood); // 등받이
    px(g, 6, 14, 44, 6, palette.wood); // 좌판
    px(g, 6, 4, 44, 1, tint(palette.wood, 0.2), 0.6);
    px(g, 6, 14, 44, 1, tint(palette.wood, 0.2), 0.6);
    px(g, 6, 19, 44, 1, shade(palette.wood, 0.2), 0.5);
  });

  tex(scene, 'prop-fence', 40, 36, (g) => {
    // 말뚝 3개 + 가로대 2줄
    [4, 17, 30].forEach((x) => {
      px(g, x, 4, 6, 30, palette.fenceWood);
      px(g, x, 4, 2, 30, tint(palette.fenceWood, 0.2), 0.6);
      px(g, x, 4, 6, 2, tint(palette.fenceWood, 0.25), 0.6); // 말뚝 머리
      px(g, x + 4, 4, 2, 30, palette.fenceWoodDark, 0.5);
    });
    px(g, 0, 11, 40, 4, palette.fenceWoodDark);
    px(g, 0, 23, 40, 4, palette.fenceWoodDark);
    px(g, 0, 11, 40, 1, tint(palette.fenceWood, 0.15), 0.5);
  });

  (['pink', 'white', 'purple', 'yellow'] as const).forEach((color) => {
    const fill = { pink: palette.flowerPink, white: palette.flowerWhite, purple: palette.flowerPurple, yellow: palette.flowerYellow }[color];
    tex(scene, `prop-flower-${color}`, 24, 24, (g) => {
      px(g, 8, 21, 8, 2, 0x3a2c20, 0.14);
      px(g, 11, 11, 2, 10, palette.cropLeafDark); // 줄기
      px(g, 7, 14, 4, 2, palette.cropLeaf); // 잎
      px(g, 13, 16, 4, 2, palette.cropLeaf);
      // 꽃잎 (십자 블록)
      px(g, 9, 5, 6, 6, fill);
      px(g, 6, 7, 3, 3, fill);
      px(g, 15, 7, 3, 3, fill);
      px(g, 10, 3, 3, 3, fill);
      px(g, 10, 11, 3, 3, fill);
      px(g, 10, 7, 3, 3, palette.flowerCenter); // 꽃심
    });
  });
}

// ───────────────────────────────────────────────────────────
//  파티클 (블록 스파클 / 별 / 점)
// ───────────────────────────────────────────────────────────
export function generateParticleTextures(scene: Phaser.Scene) {
  tex(scene, 'particle-sparkle', 12, 12, (g) => {
    px(g, 5, 0, 2, 12, 0xffffff);
    px(g, 0, 5, 12, 2, 0xffffff);
    px(g, 4, 4, 4, 4, 0xffffff);
  });
  tex(scene, 'particle-star', 12, 12, (g) => {
    px(g, 5, 1, 2, 10, palette.flowerYellow);
    px(g, 1, 5, 10, 2, palette.flowerYellow);
    px(g, 3, 3, 6, 6, palette.flowerYellow);
    px(g, 4, 4, 4, 4, tint(palette.flowerYellow, 0.4));
  });
  tex(scene, 'particle-dot', 6, 6, (g) => {
    px(g, 1, 1, 4, 4, 0xffffff);
  });
}

// ───────────────────────────────────────────────────────────
export function generateAllTextures(scene: Phaser.Scene, playerColors: PlayerColors) {
  generatePlayerTextures(scene, playerColors);
  generateTileTextures(scene);
  generateCropTextures(scene);
  generateTreeTexture(scene);
  generatePropTextures(scene);
  generateParticleTextures(scene);
  generateBuildingTexture(scene, { key: 'building-house', w: 80, h: 76, roof: palette.roofRed, wall: palette.plank });
  generateBuildingTexture(scene, { key: 'building-shop', w: 68, h: 64, roof: palette.roofBlue, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-library', w: 70, h: 66, roof: palette.roofGreen, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-school', w: 76, h: 70, roof: palette.roofBrown, wall: palette.plank });
  generateBuildingTexture(scene, { key: 'building-storage', w: 56, h: 54, roof: palette.shingle, wall: palette.barnRed, barn: true });
}
