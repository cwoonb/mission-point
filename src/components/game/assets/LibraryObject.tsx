import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';
import { ShingleRows, PlankLines, CrossWindow } from './BuildingDetails';

/** 도서관 — 마을의 독서/문화 시설, 초록 기와 지붕 + 판자 벽 + 책 장식 + 그림자 */
export default function LibraryObject({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={60} cy={109} rx={54} ry={7} />
      {/* 벽 */}
      <rect x="10" y="46" width="100" height="60" rx="6" fill={palette.wallCream} />
      <PlankLines x={10} y={46} width={100} height={60} color={palette.wallCreamShade} gap={9} />
      <rect x="10" y="98" width="100" height="8" rx="3" fill={palette.wallCreamShade} opacity="0.6" />
      {/* 지붕 */}
      <path d="M4 46 L60 14 L116 46 Z" fill={palette.leafMid} />
      <path d="M60 14 L88 32 H60 Z" fill={palette.leafDark} opacity="0.35" />
      <ShingleRows apex={[60, 14]} left={[4, 46]} right={[116, 46]} color={palette.leafMid} rows={5} />
      <rect x="2" y="44" width="116" height="4" rx="2" fill={tint(palette.leafMid, 0.2)} />
      {/* 문 */}
      <rect x="50" y="70" width="20" height="36" rx="2" fill={palette.woodDark} />
      <rect x="50" y="70" width="6" height="36" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="64" y="70" width="6" height="36" fill={shade(palette.woodDark, 0.2)} opacity="0.4" />
      {/* 창문 */}
      <CrossWindow x={20} y={58} size={16} />
      <CrossWindow x={84} y={58} size={16} />
      {/* 책 장식 */}
      <rect x="42" y="58" width="6" height="16" rx="1" fill={palette.roofRed} />
      <rect x="49" y="56" width="6" height="18" rx="1" fill={palette.roofBlue} />
      <rect x="56" y="59" width="6" height="15" rx="1" fill={palette.flowerYellow} />
      <rect x="42" y="58" width="2" height="16" fill={tint(palette.roofRed, 0.25)} opacity="0.6" />
      <rect x="49" y="56" width="2" height="18" fill={tint(palette.roofBlue, 0.25)} opacity="0.6" />
      <rect x="56" y="59" width="2" height="15" fill={tint(palette.flowerYellow, 0.25)} opacity="0.6" />
    </svg>
  );
}
