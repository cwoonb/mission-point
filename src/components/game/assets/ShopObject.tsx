import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';
import { PlankLines } from './BuildingDetails';

/** 마을 상점 — 줄무늬 차양이 있는 장터 가판대 */
export default function ShopObject({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={60} cy={109} rx={50} ry={7} />
      <rect x="14" y="48" width="92" height="58" rx="6" fill={palette.wallCream} />
      <PlankLines x={14} y={48} width={92} height={58} color={palette.wallCreamShade} gap={9} />
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
      <rect x="2" y="46" width="116" height="3" rx="1.5" fill={tint(palette.roofRed, 0.2)} />
      {/* 가판대 카운터 */}
      <rect x="24" y="70" width="72" height="36" rx="4" fill={palette.wood} />
      <rect x="24" y="70" width="72" height="8" fill={palette.woodDark} />
      <rect x="24" y="78" width="72" height="3" fill={tint(palette.wood, 0.2)} opacity="0.6" />
      <rect x="24" y="98" width="72" height="8" fill={shade(palette.wood, 0.18)} opacity="0.5" />
      {/* 진열 상품 */}
      <circle cx="42" cy="64" r="8" fill={palette.flowerYellow} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="60" cy="62" r="9" fill={palette.flowerPink} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="79" cy="64" r="8" fill={palette.leafMid} stroke={palette.woodDark} strokeWidth="2" />
      <circle cx="39" cy="61" r="2" fill="#FFFFFF" opacity="0.5" />
      <circle cx="57" cy="59" r="2.2" fill="#FFFFFF" opacity="0.5" />
      <circle cx="76" cy="61" r="2" fill="#FFFFFF" opacity="0.5" />
      {/* 깃발 */}
      <rect x="58" y="6" width="4" height="14" fill={palette.woodDark} />
      <path d="M62 6 L78 11 L62 16 Z" fill={palette.flowerYellow} />
      <path d="M62 11 L78 11 L62 16 Z" fill={shade(palette.flowerYellow, 0.2)} opacity="0.4" />
    </svg>
  );
}
