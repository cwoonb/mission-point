import Phaser from 'phaser';
import { palette, shade, tint } from '../assets/palette';

// ── 픽셀 헬퍼 ───────────────────────────────────────────────
type Col = string | number;
const col = (c: Col): number => (typeof c === 'number' ? c : parseInt(c.replace('#', ''), 16));

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}
function px(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, c: Col, a = 1) {
  g.fillStyle(col(c), a);
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}
function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ── 캐릭터 (갈색 단발 + 분홍 원피스, 4방향 + 포즈) ──────────────
const CH = {
  skin: '#F6C9A0', skinD: '#E0A87E',
  hair: '#6E4A2E', hairD: '#543620', hairH: '#8A5E3C',
  dress: '#F2A6C4', dressD: '#D67FA4', dressH: '#FBC7DC',
  apron: '#FFF4F8',
  shoes: '#7A5236', shoesD: '#5E3E28',
  ink: '#3A2C20', cheek: '#FCA8C0',
};
const CW = 32, CHH = 44;

type Facing = 'down' | 'up' | 'side';
type Arms = 'normal' | 'wave' | 'cheer';

function drawChar(g: Phaser.GameObjects.Graphics, facing: Facing, frame: 0 | 1, arms: Arms, seated: boolean) {
  const up = frame === 0 ? -1 : 1;
  const dn = frame === 0 ? 1 : -1;
  // 그림자
  px(g, 9, 40, 14, 3, CH.ink, 0.16);

  if (seated) {
    // 앉은 자세 — 다리 앞으로 접음
    px(g, 10, 32, 12, 5, CH.dressD);
    px(g, 9, 35, 6, 4, CH.skin);   // 무릎/다리
    px(g, 17, 35, 6, 4, CH.skin);
    px(g, 9, 38, 6, 3, CH.shoes);
    px(g, 17, 38, 6, 3, CH.shoes);
  } else {
    // 다리 + 신발 (걷기 바운스)
    px(g, 12, 33 + up, 4, 7, CH.skin);
    px(g, 16, 33 + dn, 4, 7, CH.skin);
    px(g, 11, 39 + up, 6, 3, CH.shoes);
    px(g, 16, 39 + dn, 6, 3, CH.shoes);
  }

  // 몸통(원피스)
  const bodyY = seated ? 22 : 20;
  px(g, 9, bodyY, 14, seated ? 12 : 14, CH.dress);
  px(g, 9, bodyY, 14, 2, CH.dressH, 0.7);
  px(g, 9, bodyY + (seated ? 9 : 11), 14, 3, CH.dressD, 0.5);
  // 앞치마 포인트
  px(g, 13, bodyY + 2, 6, seated ? 8 : 10, CH.apron, 0.85);

  // 팔
  const armDn = 23 + dn, armUp = 23 + up;
  if (arms === 'cheer') {
    px(g, 6, 12, 4, 10, CH.dress); px(g, 6, 9, 4, 4, CH.skin);
    px(g, 22, 12, 4, 10, CH.dress); px(g, 22, 9, 4, 4, CH.skin);
  } else if (arms === 'wave') {
    px(g, 6, armDn, 4, 10, CH.dress); px(g, 6, armDn + 9, 4, 3, CH.skin);
    px(g, 23, 11, 4, 9, CH.dress); px(g, 23, 8, 4, 4, CH.skin); // 한 손 흔들기
  } else if (facing === 'side') {
    px(g, 14, armDn, 4, 11, CH.dress); px(g, 14, armDn + 10, 4, 3, CH.skin);
  } else {
    px(g, 6, armDn, 4, 11, CH.dress); px(g, 6, armDn + 10, 4, 3, CH.skin);
    px(g, 22, armUp, 4, 11, CH.dress); px(g, 22, armUp + 10, 4, 3, CH.skin);
  }

  // 머리
  if (facing === 'up') {
    px(g, 9, 6, 14, 13, CH.hair);
    px(g, 9, 6, 14, 3, CH.hairH, 0.6);
  } else {
    px(g, 10, 8, 12, 11, CH.skin);          // 얼굴
    px(g, 19, 10, 3, 8, CH.skinD, 0.4);
    // 단발 머리
    px(g, 8, 5, 16, 6, CH.hair);            // 윗머리
    px(g, 8, 5, 4, 14, CH.hair);            // 왼 옆머리
    px(g, 20, 5, 4, 14, CH.hair);           // 오른 옆머리
    px(g, 8, 5, 16, 2, CH.hairH, 0.6);
    if (facing === 'side') { px(g, 8, 5, 7, 14, CH.hair); } // 옆: 뒤통수 덮음
  }

  // 얼굴 디테일
  if (facing === 'down') {
    px(g, 13, 12, 2, 2, CH.ink); px(g, 18, 12, 2, 2, CH.ink);
    px(g, 12, 15, 2, 1, CH.cheek, 0.7); px(g, 19, 15, 2, 1, CH.cheek, 0.7);
    px(g, 15, 15, 2, 1, CH.skinD, 0.6);
  } else if (facing === 'side') {
    px(g, 18, 12, 2, 2, CH.ink);
    px(g, 20, 15, 2, 1, CH.cheek, 0.7);
  }
}

/** 캐릭터 텍스처 일괄 생성 */
export function generateCharacterTextures(scene: Phaser.Scene) {
  const mk = (key: string, f: Facing, fr: 0 | 1, arms: Arms, seated = false) =>
    tex(scene, key, CW, CHH, (g) => drawChar(g, f, fr, arms, seated));
  mk('pc-down-a', 'down', 0, 'normal'); mk('pc-down-b', 'down', 1, 'normal');
  mk('pc-up-a', 'up', 0, 'normal'); mk('pc-up-b', 'up', 1, 'normal');
  mk('pc-side-a', 'side', 0, 'normal'); mk('pc-side-b', 'side', 1, 'normal');
  mk('pc-sit', 'down', 0, 'normal', true);
  mk('pc-wave', 'down', 0, 'wave');
  mk('pc-cheer', 'down', 0, 'cheer');
}

// ── 감정 버블 ──────────────────────────────────────────────
export function generateEmoteTextures(scene: Phaser.Scene) {
  tex(scene, 'emote-heart', 16, 16, (g) => {
    px(g, 3, 4, 4, 4, '#FF6F91'); px(g, 9, 4, 4, 4, '#FF6F91');
    px(g, 2, 6, 12, 3, '#FF6F91'); px(g, 4, 9, 8, 2, '#FF6F91'); px(g, 6, 11, 4, 2, '#FF6F91');
    px(g, 4, 5, 2, 2, '#FFB3C6');
  });
  tex(scene, 'emote-excl', 16, 16, (g) => {
    px(g, 6, 2, 4, 8, '#FFD23F'); px(g, 6, 11, 4, 3, '#FFD23F');
    px(g, 6, 2, 2, 8, '#FFE789', 0.8);
  });
  tex(scene, 'emote-note', 16, 16, (g) => {
    px(g, 9, 2, 3, 9, '#7FC8E6'); px(g, 5, 9, 5, 4, '#7FC8E6'); px(g, 9, 2, 4, 2, '#7FC8E6');
  });
  tex(scene, 'emote-smile', 16, 16, (g) => {
    px(g, 3, 3, 10, 10, '#FFE08A'); px(g, 5, 6, 2, 2, CH.ink); px(g, 9, 6, 2, 2, CH.ink);
    px(g, 5, 9, 6, 2, CH.ink);
  });
}

// ── 펫 (종별 색상, 작은 4족 + 귀, 걷기/앉기) ──────────────────
const PET_COLOR: Record<string, string> = {
  dog: '#C9924E', cat: '#9AA0AA', rabbit: '#EFE6DC', chick: '#F4D24E', dino: '#7BC36A',
  fox: '#E07A3C', slime: '#6FC98A', unicorn: '#EBD3F2', dragon: '#7A8AD6', phoenix: '#E5683C',
};
const PW = 26, PHH = 24;

function drawPet(g: Phaser.GameObjects.Graphics, body: string, frame: 0 | 1, sit: boolean) {
  const light = tint(body, 0.22), dark = shade(body, 0.2);
  const up = frame === 0 ? 0 : 1;
  px(g, 5, 21, 16, 3, '#3A2C20', 0.16); // 그림자
  if (!sit) {
    px(g, 7, 18 - up, 3, 4, dark); px(g, 16, 18 + up, 3, 4, dark); // 다리
  } else {
    px(g, 7, 19, 12, 3, dark); // 앉은 엉덩이
  }
  // 몸통
  px(g, 6, 11, 14, 9, body);
  px(g, 6, 11, 14, 2, light, 0.7);
  px(g, 6, 17, 14, 2, dark, 0.4);
  // 꼬리
  px(g, 19, 10 - up, 4, 4, body);
  // 머리
  px(g, 13, 5, 10, 9, body);
  px(g, 13, 5, 10, 2, light, 0.7);
  // 귀
  px(g, 13, 2, 3, 4, body); px(g, 20, 2, 3, 4, body);
  px(g, 13, 2, 3, 2, dark, 0.4); px(g, 20, 2, 3, 2, dark, 0.4);
  // 눈/코
  px(g, 15, 8, 2, 2, '#3A2C20'); px(g, 19, 8, 2, 2, '#3A2C20');
  px(g, 17, 10, 2, 1, '#3A2C20', 0.8);
}

export function generatePetTextures(scene: Phaser.Scene, species: string) {
  const body = PET_COLOR[species] ?? '#C9924E';
  tex(scene, `pet-${species}-a`, PW, PHH, (g) => drawPet(g, body, 0, false));
  tex(scene, `pet-${species}-b`, PW, PHH, (g) => drawPet(g, body, 1, false));
  tex(scene, `pet-${species}-sit`, PW, PHH, (g) => drawPet(g, body, 0, true));
}

// ── 지면 타일 + 집 ─────────────────────────────────────────
export function generateGroundTextures(scene: Phaser.Scene) {
  [0, 1, 2].forEach((v) => {
    const base = v === 1 ? palette.grassB : palette.grassA;
    tex(scene, v === 0 ? 'home-grass' : `home-grass-${v + 1}`, 32, 32, (g) => {
      px(g, 0, 0, 32, 32, base);
      const r = rng(v * 71 + 5);
      for (let i = 0; i < 6; i++) px(g, Math.floor(r() * 30), Math.floor(r() * 30), 2, 3, palette.grassBlade, 0.55);
      for (let i = 0; i < 4; i++) px(g, Math.floor(r() * 31), Math.floor(r() * 31), 2, 2, palette.grassHi, 0.5);
    });
  });
  tex(scene, 'home-path', 32, 32, (g) => {
    px(g, 0, 0, 32, 32, palette.pathSand);
    const r = rng(91);
    for (let i = 0; i < 9; i++) px(g, Math.floor(r() * 30), Math.floor(r() * 30), 2, 2, palette.pathSandDark, 0.5);
    for (let i = 0; i < 5; i++) px(g, Math.floor(r() * 30), Math.floor(r() * 30), 2, 1, palette.pathSandHi, 0.6);
  });
}

export function generateHouseTexture(scene: Phaser.Scene) {
  tex(scene, 'home-house', 92, 84, (g) => {
    const w = 92, roofH = 38;
    px(g, 8, 80, 76, 3, '#3A2C20', 0.16);
    // 벽 (통나무 판자)
    px(g, 10, roofH - 2, w - 20, 84 - roofH - 2, palette.plank);
    for (let x = 10; x < w - 10; x += 6) px(g, x, roofH - 2, 1, 84 - roofH, shade(palette.plank, 0.12), 0.5);
    px(g, 10, roofH - 2, w - 20, 2, tint(palette.plank, 0.18), 0.6);
    px(g, 10, 78, w - 20, 3, shade(palette.plank, 0.14), 0.4);
    // 지붕 (파란 너와 — 목업 톤)
    const roof = '#5C76B0';
    for (let yy = 0; yy < roofH; yy++) {
      const t = yy / (roofH - 1);
      const half = Math.round((w / 2 + 3) * t);
      px(g, w / 2 - half, yy, half * 2, 1, Math.floor(yy / 3) % 2 ? shade(roof, 0.14) : roof);
    }
    px(g, w / 2 - 1, 2, 3, 18, tint(roof, 0.2), 0.6);
    // 문
    px(g, w / 2 - 8, 60, 16, 20, palette.shingle);
    px(g, w / 2 - 8, 60, 3, 20, palette.shingleHi, 0.6);
    px(g, w / 2 + 4, 69, 2, 2, palette.strawHat);
    // 창문
    [18, w - 30].forEach((wx) => {
      px(g, wx, roofH + 6, 12, 12, '#BFE3F2'); px(g, wx, roofH + 6, 12, 6, '#D8F0FA', 0.7);
      px(g, wx + 6, roofH + 6, 1, 12, palette.shingle); px(g, wx, roofH + 12, 12, 1, palette.shingle);
    });
  });
}

// ── 파티클 ─────────────────────────────────────────────────
export function generateHomeParticles(scene: Phaser.Scene) {
  tex(scene, 'p-dust', 6, 6, (g) => px(g, 1, 1, 4, 4, '#FFFFFF', 0.8));
  tex(scene, 'p-sparkle', 10, 10, (g) => { px(g, 4, 0, 2, 10, '#FFF6D6'); px(g, 0, 4, 10, 2, '#FFF6D6'); px(g, 3, 3, 4, 4, '#FFFFFF'); });
  tex(scene, 'p-heart', 12, 12, (g) => { px(g, 2, 3, 3, 3, '#FF6F91'); px(g, 7, 3, 3, 3, '#FF6F91'); px(g, 1, 5, 10, 2, '#FF6F91'); px(g, 3, 7, 6, 2, '#FF6F91'); px(g, 5, 9, 2, 1, '#FF6F91'); });
  tex(scene, 'p-rain', 3, 10, (g) => px(g, 0, 0, 2, 10, '#AFd2EA', 0.7));
  tex(scene, 'p-petal', 6, 6, (g) => { px(g, 1, 0, 4, 3, '#FBC7DC'); px(g, 0, 2, 6, 3, '#F2A6C4'); px(g, 2, 1, 2, 2, '#FFE3EE', 0.8); });
  tex(scene, 'p-firefly', 6, 6, (g) => { px(g, 1, 1, 4, 4, '#FFF1A8'); px(g, 2, 2, 2, 2, '#FFFFFF'); });
}

// ── 꾸미기 아이템 텍스처 ────────────────────────────────────
export function generateDecorTextures(scene: Phaser.Scene) {
  const wood = palette.wood, woodD = palette.woodDark, leaf = palette.leafMid, leafD = palette.leafDark, leafL = palette.leafLight;

  tex(scene, 'decor-chair', 26, 34, (g) => {
    px(g, 5, 32, 16, 2, '#3A2C20', 0.16);
    px(g, 6, 6, 4, 26, woodD); px(g, 16, 6, 4, 26, woodD);  // 등받이 기둥/다리
    px(g, 5, 18, 16, 5, wood); px(g, 5, 18, 16, 1, tint(wood, 0.2), 0.6); // 좌판
    px(g, 6, 6, 14, 4, wood); // 등받이 상단
  });
  tex(scene, 'decor-bench', 52, 30, (g) => {
    px(g, 6, 28, 40, 2, '#3A2C20', 0.16);
    px(g, 8, 8, 4, 20, woodD); px(g, 40, 8, 4, 20, woodD);
    px(g, 5, 4, 42, 5, wood); px(g, 5, 14, 42, 6, wood);
    px(g, 5, 4, 42, 1, tint(wood, 0.2), 0.6); px(g, 5, 14, 42, 1, tint(wood, 0.2), 0.6);
  });
  tex(scene, 'decor-bed', 56, 40, (g) => {
    px(g, 6, 38, 44, 2, '#3A2C20', 0.16);
    px(g, 4, 10, 48, 26, woodD);                 // 프레임
    px(g, 6, 14, 44, 20, '#F4ECF7');             // 매트리스
    px(g, 6, 14, 16, 12, '#CDE3F2');             // 베개
    px(g, 22, 18, 28, 16, '#EAB9CE');            // 이불
    px(g, 22, 18, 28, 3, '#F6D2E0', 0.7);
  });
  tex(scene, 'decor-table', 38, 34, (g) => {
    px(g, 4, 32, 30, 2, '#3A2C20', 0.16);
    px(g, 16, 16, 6, 16, woodD);                 // 기둥
    px(g, 4, 10, 30, 8, wood); px(g, 4, 10, 30, 2, tint(wood, 0.2), 0.6); // 상판
    px(g, 16, 6, 8, 4, '#E07A6A'); // 작은 화병
  });
  tex(scene, 'decor-rug', 56, 40, (g) => {
    px(g, 2, 2, 52, 36, '#E7A6C0');
    for (let y = 2; y < 38; y += 8) for (let x = 2; x < 54; x += 8) if (((x + y) / 8) % 2 < 1) px(g, x, y, 8, 8, '#F4CBDD', 0.7);
    px(g, 2, 2, 52, 2, '#D67FA4'); px(g, 2, 36, 52, 2, '#D67FA4');
  });
  tex(scene, 'decor-lamp', 22, 48, (g) => {
    px(g, 6, 46, 10, 2, '#3A2C20', 0.16);
    px(g, 9, 12, 4, 34, '#5E5147'); // 기둥
    px(g, 5, 4, 12, 10, '#FFE9A8'); px(g, 5, 4, 12, 2, '#FFF6D6'); // 등
    px(g, 4, 3, 14, 2, '#5E5147');
  });
  tex(scene, 'decor-tree', 52, 64, (g) => {
    px(g, 16, 60, 20, 3, '#3A2C20', 0.16);
    px(g, 22, 40, 8, 22, palette.trunkDark); px(g, 22, 40, 3, 22, palette.trunk);
    px(g, 10, 18, 32, 22, leafD); px(g, 8, 24, 36, 12, leafD);
    px(g, 13, 22, 26, 16, leaf); px(g, 16, 18, 18, 8, leaf);
    px(g, 16, 22, 16, 8, leafL, 0.8);
  });
  tex(scene, 'decor-bush', 34, 28, (g) => {
    px(g, 4, 25, 26, 3, '#3A2C20', 0.14);
    px(g, 4, 10, 26, 16, leafD); px(g, 7, 7, 20, 10, leaf); px(g, 10, 8, 12, 6, leafL, 0.8);
    px(g, 12, 14, 3, 3, '#FF9FBC'); px(g, 20, 17, 3, 3, '#FFD66B');
  });
  tex(scene, 'decor-flowerbed', 44, 26, (g) => {
    px(g, 3, 22, 38, 3, '#3A2C20', 0.14);
    px(g, 2, 14, 40, 10, palette.soil); px(g, 2, 14, 40, 2, palette.soilHi, 0.5);
    const cols = ['#FF9FBC', '#FFD66B', '#C7A6FF', '#FFFFFF'];
    for (let i = 0; i < 6; i++) { const x = 5 + i * 6; px(g, x, 6, 4, 4, cols[i % 4]); px(g, x + 1, 9, 2, 5, leafD); }
  });
  tex(scene, 'decor-sunflower', 22, 40, (g) => {
    px(g, 7, 38, 8, 2, '#3A2C20', 0.14);
    px(g, 10, 14, 2, 24, leafD); px(g, 5, 22, 5, 2, leaf); px(g, 12, 26, 5, 2, leaf);
    px(g, 5, 4, 12, 12, '#FFCB3D'); px(g, 5, 4, 12, 3, '#FFE07A', 0.7);
    px(g, 8, 7, 6, 6, '#8A5A2E');
  });
  tex(scene, 'decor-pot', 22, 30, (g) => {
    px(g, 5, 28, 12, 2, '#3A2C20', 0.16);
    px(g, 6, 18, 10, 10, '#C97A52'); px(g, 6, 18, 10, 2, '#E0976E', 0.6); px(g, 5, 16, 12, 3, '#B0673E');
    px(g, 7, 6, 8, 12, leaf); px(g, 9, 4, 4, 5, leafL); px(g, 6, 10, 4, 5, leafD);
  });
  tex(scene, 'decor-fence', 36, 28, (g) => {
    [3, 15, 27].forEach((x) => { px(g, x, 4, 6, 22, palette.fenceWood); px(g, x, 4, 2, 22, tint(palette.fenceWood, 0.2), 0.6); px(g, x, 3, 6, 2, tint(palette.fenceWood, 0.25), 0.6); });
    px(g, 0, 9, 36, 4, palette.fenceWoodDark); px(g, 0, 18, 36, 4, palette.fenceWoodDark);
  });
  tex(scene, 'decor-gate', 40, 46, (g) => {
    px(g, 4, 44, 32, 2, '#3A2C20', 0.16);
    px(g, 4, 8, 6, 36, palette.fenceWood); px(g, 30, 8, 6, 36, palette.fenceWood);
    px(g, 4, 4, 32, 8, palette.fenceWoodDark); px(g, 10, 0, 20, 6, palette.fenceWoodDark); // 아치
    px(g, 12, 14, 6, 6, leaf); px(g, 22, 16, 6, 6, '#FF9FBC'); // 덩굴
  });
  tex(scene, 'decor-fountain', 42, 40, (g) => {
    px(g, 4, 37, 34, 3, '#3A2C20', 0.16);
    px(g, 3, 22, 36, 14, palette.stoneDark); px(g, 5, 20, 32, 12, palette.stone);
    px(g, 9, 24, 24, 6, palette.water); px(g, 9, 24, 24, 2, palette.waterFoam, 0.7);
    px(g, 18, 6, 6, 16, palette.stone); px(g, 14, 4, 14, 3, palette.stone);
    px(g, 19, 8, 4, 12, palette.water, 0.7);
  });
  tex(scene, 'decor-parasol', 48, 50, (g) => {
    px(g, 10, 48, 28, 2, '#3A2C20', 0.16);
    px(g, 23, 18, 3, 30, '#9C7A52'); // 기둥
    px(g, 4, 10, 40, 10, '#E76F6F'); // 우산 천
    px(g, 4, 10, 40, 3, '#F49A9A', 0.7);
    px(g, 12, 6, 24, 6, '#E76F6F'); px(g, 20, 3, 8, 4, '#E76F6F');
    px(g, 4, 18, 40, 2, '#C95151');
  });
  tex(scene, 'decor-mailbox', 22, 36, (g) => {
    px(g, 5, 34, 12, 2, '#3A2C20', 0.16);
    px(g, 9, 14, 4, 20, palette.fenceWoodDark);
    px(g, 3, 6, 16, 10, '#E2664E'); px(g, 3, 6, 16, 3, '#EE8870', 0.6);
    px(g, 17, 7, 4, 6, '#F4ECE0'); px(g, 5, 9, 4, 4, '#3A2C20', 0.5);
  });
  tex(scene, 'decor-sign', 28, 30, (g) => {
    px(g, 8, 28, 12, 2, '#3A2C20', 0.16);
    px(g, 12, 12, 4, 16, woodD);
    px(g, 3, 4, 22, 12, wood); px(g, 3, 4, 22, 2, tint(wood, 0.2), 0.6);
    px(g, 6, 8, 16, 2, woodD, 0.5); px(g, 6, 11, 11, 2, woodD, 0.5);
  });
  tex(scene, 'decor-lantern', 22, 38, (g) => {
    px(g, 5, 36, 12, 2, '#3A2C20', 0.16);
    px(g, 7, 28, 8, 8, palette.stoneDark); px(g, 6, 24, 10, 5, palette.stone);
    px(g, 7, 14, 8, 10, palette.stone); px(g, 8, 16, 6, 6, '#FFE9A8'); // 불빛
    px(g, 5, 10, 12, 4, palette.stoneDark); px(g, 7, 6, 8, 4, palette.stone);
  });
}

/** HomeScene 진입 시 한 번 호출 — 정적 텍스처 일괄 생성 */
export function generateHomeTextures(scene: Phaser.Scene) {
  generateCharacterTextures(scene);
  generateEmoteTextures(scene);
  generateGroundTextures(scene);
  generateHouseTexture(scene);
  generateHomeParticles(scene);
  generateDecorTextures(scene);
}
