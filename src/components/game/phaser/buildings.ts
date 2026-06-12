import Phaser from 'phaser';
import { generateBuildingTexture } from './textures';

/** HouseRenderer의 TIER_COLORS와 동일한 등급별 색상 (src/components/game/house/HouseRenderer.tsx 참고) */
const HOUSE_TIER_COLORS: Record<1 | 2 | 3, { roof: string; wall: string; scale: number }> = {
  1: { roof: '#E2664E', wall: '#FFF6E5', scale: 1 },
  2: { roof: '#9C6F4E', wall: '#F6ECD9', scale: 1.06 },
  3: { roof: '#6F8FCB', wall: '#F1F0F7', scale: 1.15 },
};

/** 집 등급(1~3)에 맞는 텍스처를 생성(없으면)하고 키를 반환한다 */
export function houseTierTextureKey(scene: Phaser.Scene, tier: 1 | 2 | 3): string {
  const key = `building-house-tier-${tier}`;
  if (scene.textures.exists(key)) return key;
  const { roof, wall, scale } = HOUSE_TIER_COLORS[tier];
  generateBuildingTexture(scene, { key, w: Math.round(80 * scale), h: Math.round(76 * scale), roof, wall });
  return key;
}
