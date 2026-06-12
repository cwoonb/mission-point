import { palette } from './palette';

/** 보유함(인벤토리) 입구 — 나무 보물상자 */
export default function StorageChestObject({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 88" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="38" width="88" height="44" rx="6" fill={palette.wood} />
      <rect x="6" y="38" width="88" height="10" fill={palette.woodDark} />
      <path d="M6 38 Q50 14 94 38 Z" fill={palette.roofBrown} />
      <path d="M6 38 Q50 14 94 38 L94 48 Q50 24 6 48 Z" fill={palette.roofBrownShade} />
      <rect x="44" y="44" width="12" height="16" rx="2" fill={palette.flowerYellow} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="50" cy="52" r="2.5" fill={palette.woodDark} />
    </svg>
  );
}
