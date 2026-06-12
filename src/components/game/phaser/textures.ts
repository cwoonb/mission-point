import Phaser from 'phaser';
import { palette, shade, tint } from '../assets/palette';

/** '#RRGGBB' → 0xRRGGBB */
function n(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

function tex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

export interface PlayerColors {
  skin: string;
  hair: string;
  top: string;
  bottom: string;
  shoes: string;
}

/** 동물 주민 종(species)별 몸 색상 — AnimalResident/BirdResident 팔레트와 동일 */
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

/** 캐릭터 한쪽 세트(머리/몸통/팔/다리/신발)를 그린다. legOffset로 걷기 바운스를 표현 */
function drawCharBody(g: Phaser.GameObjects.Graphics, colors: PlayerColors, facing: 'down' | 'up' | 'side', legPhase: 0 | 1) {
  const { skin, hair, top, bottom, shoes } = colors;
  const topLight = tint(top, 0.2);
  const topDark = shade(top, 0.16);
  const skinLight = tint(skin, 0.2);
  const skinDark = shade(skin, 0.12);
  const hairDark = shade(hair, 0.18);
  const legUp = legPhase === 0 ? -2 : 2;
  const legDown = legPhase === 0 ? 2 : -2;

  // 바닥 그림자
  g.fillStyle(0x4a3526, 0.18);
  g.fillEllipse(20, 49, 22, 5);

  // 다리 (걷기 시 교차 바운스)
  g.fillStyle(n(bottom), 1);
  g.fillRoundedRect(13, 33 + legUp, 6, 12, 2);
  g.fillRoundedRect(21, 33 + legDown, 6, 12, 2);
  // 신발
  g.fillStyle(n(shoes), 1);
  g.fillEllipse(16, 46 + legUp, 8, 4);
  g.fillEllipse(24, 46 + legDown, 8, 4);

  if (facing === 'side') {
    // 뒤쪽 팔
    g.fillStyle(n(topDark), 1);
    g.fillRoundedRect(24, 21 + legUp, 5, 13, 2);
    // 몸통
    g.fillStyle(n(top), 1);
    g.fillRoundedRect(11, 18, 18, 16, 7);
    g.fillStyle(n(topLight), 0.4);
    g.fillRoundedRect(11, 18, 18, 5, 7);
    // 앞쪽 팔
    g.fillStyle(n(top), 1);
    g.fillRoundedRect(11, 21 + legDown, 5, 13, 2);
  } else {
    // 팔 (다리와 반대 위상)
    g.fillStyle(n(top), 1);
    g.fillRoundedRect(8, 21 + legDown, 5, 13, 2);
    g.fillRoundedRect(27, 21 + legUp, 5, 13, 2);
    // 몸통
    g.fillRoundedRect(11, 18, 18, 16, 7);
    g.fillStyle(n(topLight), 0.4);
    g.fillRoundedRect(11, 18, 18, 5, 7);
    g.fillStyle(n(topDark), 0.3);
    g.fillRoundedRect(11, 29, 18, 5, 5);
  }

  // 머리
  g.fillStyle(n(skin), 1);
  g.fillCircle(20, 11, 9);
  g.fillStyle(n(skinLight), 0.45);
  g.fillEllipse(17, 8, 9, 6);
  g.fillStyle(n(skinDark), 0.3);
  g.fillEllipse(24, 14, 9, 6);

  if (facing === 'down') {
    // 볼터치 + 눈
    g.fillStyle(0xfda4af, 0.6);
    g.fillEllipse(15, 13, 3, 2);
    g.fillEllipse(25, 13, 3, 2);
    g.fillStyle(0x3a2c20, 1);
    g.fillCircle(17, 11, 1.3);
    g.fillCircle(23, 11, 1.3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(17.5, 10.5, 0.5);
    g.fillCircle(23.5, 10.5, 0.5);
    // 헤어 (앞머리)
    g.fillStyle(n(hair), 1);
    g.fillEllipse(20, 5, 20, 11);
    g.fillRoundedRect(9, 5, 5, 11, 2);
    g.fillRoundedRect(26, 5, 5, 11, 2);
    g.fillStyle(n(hairDark), 0.3);
    g.fillEllipse(25, 8, 10, 6);
  } else if (facing === 'up') {
    // 뒤통수 — 머리카락이 머리 전체를 덮음
    g.fillStyle(n(hair), 1);
    g.fillCircle(20, 11, 9.5);
    g.fillRoundedRect(9, 8, 5, 13, 2);
    g.fillRoundedRect(26, 8, 5, 13, 2);
    g.fillStyle(n(hairDark), 0.3);
    g.fillEllipse(25, 13, 10, 8);
  } else {
    // 옆모습 — 헤어가 뒤쪽 절반을 덮고, 눈 1개만 보임
    g.fillStyle(n(hair), 1);
    g.fillEllipse(18, 6, 18, 10);
    g.fillRoundedRect(9, 6, 6, 13, 2);
    g.fillStyle(n(hairDark), 0.25);
    g.fillEllipse(13, 11, 8, 8);
    g.fillStyle(0xfda4af, 0.6);
    g.fillEllipse(25, 13, 3, 2);
    g.fillStyle(0x3a2c20, 1);
    g.fillCircle(25, 11, 1.3);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(25.5, 10.5, 0.5);
  }
}

/** 플레이어 4방향(아래/위/옆) × 걷기 2프레임 텍스처를 생성한다 (좌/우는 side를 flipX로 재사용) */
export function generatePlayerTextures(scene: Phaser.Scene, colors: PlayerColors) {
  (['down', 'up', 'side'] as const).forEach((facing) => {
    (['a', 'b'] as const).forEach((frame, i) => {
      tex(scene, `player-${facing}-${frame}`, 40, 52, (g) => drawCharBody(g, colors, facing, i as 0 | 1));
    });
  });
}

/** 동물 주민 텍스처 — 종별 몸 색상으로 단일 프레임 생성, idle은 트윈으로 처리 */
export function generateAnimalTexture(scene: Phaser.Scene, species: string) {
  const key = `npc-${species}`;
  if (scene.textures.exists(key)) return key;
  const body = ANIMAL_BODY[species] ?? palette.wood;
  const light = tint(body, 0.2);
  const dark = shade(body, 0.15);
  tex(scene, key, 44, 44, (g) => {
    g.fillStyle(0x4a3526, 0.18);
    g.fillEllipse(22, 41, 22, 5);
    // 몸
    g.fillStyle(n(body), 1);
    g.fillEllipse(22, 30, 16, 12);
    g.fillStyle(n(dark), 0.3);
    g.fillEllipse(22, 35, 14, 7);
    // 귀
    g.fillStyle(n(body), 1);
    g.fillCircle(13, 11, 6);
    g.fillCircle(31, 11, 6);
    g.fillStyle(n(dark), 0.2);
    g.fillCircle(32, 12, 3.5);
    // 머리
    g.fillCircle(22, 17, 12);
    g.fillStyle(n(light), 0.5);
    g.fillEllipse(18, 13, 8, 5.5);
    g.fillStyle(n(dark), 0.3);
    g.fillEllipse(27, 21, 9, 6);
    // 볼터치
    g.fillStyle(0xfda4af, 0.55);
    g.fillEllipse(14, 20, 2.5, 1.6);
    g.fillEllipse(30, 20, 2.5, 1.6);
    // 눈 + 반짝임
    g.fillStyle(0x3a2c20, 1);
    g.fillCircle(18, 17, 2);
    g.fillCircle(26, 17, 2);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(18.6, 16.3, 0.7);
    g.fillCircle(26.6, 16.3, 0.7);
    // 코
    g.fillStyle(0x3a2c20, 0.85);
    g.fillEllipse(22, 22, 2.5, 1.7);
  });
  return key;
}

/** 32px 잔디/길 타일 + 32px 물 텍스처(타일스프라이트로 흐름 애니메이션) */
export function generateTileTextures(scene: Phaser.Scene) {
  tex(scene, 'tile-grass', 32, 32, (g) => {
    g.fillStyle(n(palette.grassMid), 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(n(shade(palette.grassMid, 0.12)), 0.5);
    g.fillEllipse(8, 9, 9, 5);
    g.fillEllipse(24, 23, 8, 5);
    g.fillStyle(n(tint(palette.grassMid, 0.18)), 0.5);
    g.fillEllipse(21, 7, 8, 4);
    g.fillEllipse(10, 25, 7, 4);
  });
  tex(scene, 'tile-path', 32, 32, (g) => {
    g.fillStyle(n(palette.dirt), 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(n(palette.dirtEdge), 0.4);
    g.fillEllipse(9, 8, 5, 3);
    g.fillEllipse(23, 19, 6, 3);
    g.fillEllipse(6, 24, 4, 3);
    g.fillEllipse(26, 6, 4, 3);
  });
  tex(scene, 'tile-water', 32, 32, (g) => {
    g.fillStyle(n(palette.water), 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(n(palette.waterDeep), 0.35);
    g.fillRect(0, 20, 32, 12);
    g.fillStyle(n(tint(palette.water, 0.3)), 0.55);
    g.fillRect(0, 4, 32, 3);
    g.fillRect(0, 14, 32, 2);
  });
}

/** 나무 텍스처 — 흔들림 애니메이션은 회전 트윈(origin 0.5,0.97)으로 처리 */
export function generateTreeTexture(scene: Phaser.Scene) {
  tex(scene, 'tree', 56, 68, (g) => {
    g.fillStyle(0x4a3526, 0.18);
    g.fillEllipse(28, 64, 32, 7);
    g.fillStyle(n(palette.trunkDark), 1);
    g.fillRoundedRect(23, 44, 10, 20, 3);
    g.fillStyle(n(palette.trunk), 1);
    g.fillRoundedRect(23, 44, 4, 20, 2);
    g.fillStyle(n(palette.leafDark), 1);
    g.fillCircle(28, 26, 25);
    g.fillStyle(n(palette.leafMid), 1);
    g.fillCircle(26, 24, 22);
    g.fillStyle(n(palette.leafLight), 0.6);
    g.fillCircle(18, 16, 12);
  });
}

interface BuildingSpec {
  key: string;
  w: number;
  h: number;
  roof: string;
  wall: string;
}

/** 건물형 오브젝트(집/상점/도서관/학교) — 지붕 삼각형 + 벽 + 문/창 */
export function generateBuildingTexture(scene: Phaser.Scene, spec: BuildingSpec) {
  const { key, w, h, roof, wall } = spec;
  tex(scene, key, w, h, (g) => {
    const roofH = h * 0.42;
    const wallY = roofH - 4;
    const wallH = h - wallY - 6;
    g.fillStyle(0x4a3526, 0.16);
    g.fillEllipse(w / 2, h - 3, w * 0.8, 6);
    // 벽
    g.fillStyle(n(wall), 1);
    g.fillRoundedRect(4, wallY, w - 8, wallH, 4);
    g.fillStyle(n(shade(wall, 0.1)), 0.4);
    g.fillRoundedRect(4, wallY + wallH - wallH * 0.25, w - 8, wallH * 0.25, 4);
    // 지붕
    g.fillStyle(n(shade(roof, 0.12)), 1);
    g.fillTriangle(w / 2, 0, w + 2, roofH, -2, roofH);
    g.fillStyle(n(roof), 1);
    g.fillTriangle(w / 2, 2, w - 2, roofH - 2, 2, roofH - 2);
    g.fillStyle(n(tint(roof, 0.2)), 0.5);
    g.fillTriangle(w / 2, 2, w / 2 - 8, roofH - 6, w / 2 - 2, roofH - 6);
    // 문
    const doorW = w * 0.22;
    const doorH = wallH * 0.6;
    g.fillStyle(n(palette.woodDark), 1);
    g.fillRoundedRect(w / 2 - doorW / 2, h - 6 - doorH, doorW, doorH, 2);
    g.fillStyle(n(tint(palette.woodDark, 0.2)), 0.4);
    g.fillRoundedRect(w / 2 - doorW / 2, h - 6 - doorH, doorW * 0.4, doorH, 2);
    // 창문
    const winSize = w * 0.16;
    g.fillStyle(n(tint(palette.water, 0.15)), 1);
    g.fillRoundedRect(8, wallY + 6, winSize, winSize, 2);
    g.fillRoundedRect(w - 8 - winSize, wallY + 6, winSize, winSize, 2);
    g.lineStyle(1.5, n(shade(wall, 0.2)), 0.8);
    g.strokeRoundedRect(8, wallY + 6, winSize, winSize, 2);
    g.strokeRoundedRect(w - 8 - winSize, wallY + 6, winSize, winSize, 2);
  });
}

/** 작은 소품(분수/우체통/벤치/울타리/꽃) — 단순 2단 명암 도형 */
export function generatePropTextures(scene: Phaser.Scene) {
  tex(scene, 'prop-fountain', 48, 40, (g) => {
    g.fillStyle(0x4a3526, 0.16);
    g.fillEllipse(24, 37, 36, 5);
    g.fillStyle(n(palette.stoneDark), 1);
    g.fillEllipse(24, 30, 40, 16);
    g.fillStyle(n(palette.stone), 1);
    g.fillEllipse(24, 28, 36, 13);
    g.fillStyle(n(palette.water), 1);
    g.fillEllipse(24, 27, 24, 9);
    g.fillStyle(n(tint(palette.water, 0.3)), 0.6);
    g.fillEllipse(20, 24, 10, 4);
    g.fillStyle(n(palette.stone), 1);
    g.fillRoundedRect(21, 6, 6, 16, 2);
    g.fillStyle(n(tint(palette.stone, 0.3)), 0.6);
    g.fillRoundedRect(21, 6, 2.5, 16, 1);
  });

  tex(scene, 'prop-mailbox', 28, 40, (g) => {
    g.fillStyle(0x4a3526, 0.16);
    g.fillEllipse(14, 38, 18, 4);
    g.fillStyle(n(palette.woodDark), 1);
    g.fillRect(12, 16, 4, 22);
    g.fillStyle(n(palette.roofRed), 1);
    g.fillRoundedRect(3, 6, 22, 14, 6);
    g.fillStyle(n(tint(palette.roofRed, 0.25)), 0.5);
    g.fillRoundedRect(3, 6, 22, 5, 6);
    g.fillStyle(n(shade(palette.roofRed, 0.18)), 0.35);
    g.fillRoundedRect(3, 14, 22, 6, 4);
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(12, 8, 4, 8);
  });

  tex(scene, 'prop-bench', 56, 30, (g) => {
    g.fillStyle(0x4a3526, 0.16);
    g.fillEllipse(28, 28, 44, 5);
    g.fillStyle(n(palette.woodDark), 1);
    g.fillRect(8, 8, 4, 18);
    g.fillRect(44, 8, 4, 18);
    g.fillStyle(n(palette.wood), 1);
    g.fillRoundedRect(4, 4, 48, 6, 2);
    g.fillRoundedRect(4, 14, 48, 6, 2);
    g.fillStyle(n(tint(palette.wood, 0.2)), 0.5);
    g.fillRoundedRect(4, 4, 48, 2, 1);
    g.fillRoundedRect(4, 14, 48, 2, 1);
  });

  tex(scene, 'prop-fence', 40, 36, (g) => {
    g.fillStyle(n(palette.wood), 1);
    g.fillRoundedRect(4, 4, 7, 30, 2);
    g.fillRoundedRect(29, 4, 7, 30, 2);
    g.fillRoundedRect(15, 4, 10, 30, 2);
    g.fillStyle(n(shade(palette.wood, 0.18)), 0.35);
    g.fillRoundedRect(29, 4, 3, 30, 1);
    g.fillRoundedRect(15, 4, 3, 30, 1);
    g.fillStyle(n(palette.woodDark), 1);
    g.fillRect(0, 10, 40, 5);
    g.fillRect(0, 22, 40, 5);
  });

  (['pink', 'white', 'purple', 'yellow'] as const).forEach((color) => {
    const fill = { pink: palette.flowerPink, white: palette.flowerWhite, purple: palette.flowerPurple, yellow: palette.flowerYellow }[color];
    tex(scene, `prop-flower-${color}`, 24, 24, (g) => {
      g.fillStyle(0x4a3526, 0.14);
      g.fillEllipse(12, 22, 14, 3);
      g.fillStyle(n(palette.leafMid), 1);
      g.fillRoundedRect(10, 12, 4, 10, 2);
      [0, 1, 2, 3].forEach((i) => {
        const ang = (Math.PI / 2) * i;
        g.fillStyle(n(fill), 1);
        g.fillCircle(12 + Math.cos(ang) * 5, 8 + Math.sin(ang) * 5, 4);
      });
      g.fillStyle(n(palette.flowerCenter), 1);
      g.fillCircle(12, 8, 3.5);
    });
  });
}

/** 반짝이 파티클(별/다이아) 텍스처 — 미션 완료/레벨업/레어 아이템 이펙트에 사용 */
export function generateParticleTextures(scene: Phaser.Scene) {
  tex(scene, 'particle-sparkle', 16, 16, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        { x: 8, y: 0 },
        { x: 10, y: 6 },
        { x: 16, y: 8 },
        { x: 10, y: 10 },
        { x: 8, y: 16 },
        { x: 6, y: 10 },
        { x: 0, y: 8 },
        { x: 6, y: 6 },
      ],
      true
    );
  });
  tex(scene, 'particle-star', 14, 14, (g) => {
    g.fillStyle(n(palette.flowerYellow), 1);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const ang = (Math.PI / 4) * i - Math.PI / 2;
      const r = i % 2 === 0 ? 7 : 3;
      pts.push({ x: 7 + Math.cos(ang) * r, y: 7 + Math.sin(ang) * r });
    }
    g.fillPoints(pts, true);
  });
  tex(scene, 'particle-dot', 8, 8, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
  });
}

export function generateAllTextures(scene: Phaser.Scene, playerColors: PlayerColors) {
  generatePlayerTextures(scene, playerColors);
  generateTileTextures(scene);
  generateTreeTexture(scene);
  generatePropTextures(scene);
  generateParticleTextures(scene);
  generateBuildingTexture(scene, { key: 'building-house', w: 80, h: 76, roof: palette.roofRed, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-shop', w: 68, h: 64, roof: palette.roofBlue, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-library', w: 70, h: 66, roof: palette.roofGreen, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-school', w: 76, h: 70, roof: palette.roofBrown, wall: palette.wallCream });
  generateBuildingTexture(scene, { key: 'building-storage', w: 48, h: 46, roof: palette.roofBlue, wall: palette.wood });
}
