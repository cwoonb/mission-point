import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

/** 보유함(인벤토리) 입구 — 나무 보물상자, 2단 명암 + 그림자 */
export default function StorageChestObject({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 88" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={84} rx={42} ry={6} />
      <rect x="6" y="38" width="88" height="44" rx="6" fill={palette.wood} />
      <rect x="6" y="38" width="88" height="10" fill={palette.woodDark} />
      <rect x="6" y="74" width="88" height="8" fill={shade(palette.wood, 0.16)} opacity="0.5" />
      <rect x="6" y="48" width="6" height="34" fill={tint(palette.wood, 0.2)} opacity="0.5" />
      <path d="M6 38 Q50 14 94 38 Z" fill={palette.roofBrown} />
      <path d="M6 38 Q50 14 94 38 L94 48 Q50 24 6 48 Z" fill={palette.roofBrownShade} />
      <path d="M10 36 Q50 16 90 36" stroke={tint(palette.roofBrown, 0.25)} strokeWidth="2" fill="none" opacity="0.5" />
      <rect x="44" y="44" width="12" height="16" rx="2" fill={palette.flowerYellow} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="50" cy="52" r="2.5" fill={palette.woodDark} />
      <rect x="45" y="45" width="4" height="6" fill="#FFFFFF" opacity="0.3" />
    </svg>
  );
}
