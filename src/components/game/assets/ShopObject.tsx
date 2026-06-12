import { palette } from './palette';

/** 마을 상점 — 줄무늬 차양이 있는 장터 가판대 */
export default function ShopObject({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="48" width="92" height="58" rx="6" fill={palette.wallCream} />
      <rect x="14" y="48" width="92" height="14" fill={palette.wallCreamShade} />
      {/* 줄무늬 차양 */}
      <path d="M8 48 L60 18 L112 48 Z" fill={palette.roofRed} />
      {Array.from({ length: 6 }).map((_, i) => (
        <path
          key={i}
          d={`M${8 + i * 17.3} 48 L${8 + (i + 1) * 17.3} 48 L${60 - (60 - (8 + (i + 0.5) * 17.3)) * 0.5} 33 Z`}
          fill={i % 2 === 0 ? palette.flowerWhite : palette.roofRedShade}
          opacity="0.85"
        />
      ))}
      {/* 가판대 카운터 */}
      <rect x="24" y="70" width="72" height="36" rx="4" fill={palette.wood} />
      <rect x="24" y="70" width="72" height="8" fill={palette.woodDark} />
      {/* 진열 상품 */}
      <circle cx="42" cy="64" r="8" fill={palette.flowerYellow} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="60" cy="62" r="9" fill={palette.flowerPink} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="79" cy="64" r="8" fill={palette.leafMid} stroke={palette.woodDark} strokeWidth="2" />
      {/* 깃발 */}
      <rect x="58" y="6" width="4" height="14" fill={palette.woodDark} />
      <path d="M62 6 L78 11 L62 16 Z" fill={palette.flowerYellow} />
    </svg>
  );
}
