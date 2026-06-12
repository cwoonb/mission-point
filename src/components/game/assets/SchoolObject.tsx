import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';
import { ShingleRows, PlankLines, CrossWindow } from './BuildingDetails';

/** 학교 — 마을의 교육 시설, 기와 지붕 + 판자 벽 + 십자창 + 그림자 */
export default function SchoolObject({ size = 76 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={60} cy={109} rx={54} ry={7} />
      {/* 벽 */}
      <rect x="10" y="46" width="100" height="60" rx="6" fill={palette.wallCream} />
      <PlankLines x={10} y={46} width={100} height={60} color={palette.wallCreamShade} gap={9} />
      <rect x="10" y="98" width="100" height="8" rx="3" fill={palette.wallCreamShade} opacity="0.6" />
      {/* 지붕 */}
      <path d="M4 46 L60 10 L116 46 Z" fill={palette.roofBlue} />
      <path d="M60 10 L92 30 L60 30 Z" fill={palette.roofBlueShade} opacity="0.4" />
      <ShingleRows apex={[60, 10]} left={[4, 46]} right={[116, 46]} color={palette.roofBlue} rows={5} />
      <rect x="2" y="44" width="116" height="4" rx="2" fill={tint(palette.roofBlue, 0.2)} />
      {/* 문 */}
      <rect x="52" y="70" width="16" height="36" rx="2" fill={palette.woodDark} />
      <rect x="52" y="70" width="5" height="36" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="63" y="70" width="5" height="36" fill={shade(palette.woodDark, 0.2)} opacity="0.4" />
      <circle cx="64" cy="89" r="1.6" fill={palette.flowerYellow} />
      {/* 창문 */}
      <CrossWindow x={22} y={58} size={18} />
      <CrossWindow x={80} y={58} size={18} />
      {/* 깃대 */}
      <rect x="57" y="2" width="4" height="14" fill={palette.woodDark} />
      <path d="M61 2 L82 8 L61 14 Z" fill={palette.roofRed} />
      <path d="M61 8 L82 8 L61 14 Z" fill={shade(palette.roofRed, 0.2)} opacity="0.4" />
    </svg>
  );
}
