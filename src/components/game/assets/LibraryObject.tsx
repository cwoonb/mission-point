import { palette } from './palette';

/** 도서관 — 마을의 독서/문화 시설 */
export default function LibraryObject({ size = 72 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="46" width="100" height="60" rx="6" fill={palette.wallCream} />
      <path d="M4 46 L60 14 L116 46 Z" fill={palette.leafMid} />
      <path d="M60 14 L88 32 H60 Z" fill={palette.leafDark} opacity="0.35" />
      <rect x="50" y="70" width="20" height="36" fill={palette.woodDark} />
      <rect x="20" y="58" width="16" height="18" rx="2" fill={palette.flowerCenter} stroke={palette.wallCreamShade} strokeWidth="2" />
      <rect x="84" y="58" width="16" height="18" rx="2" fill={palette.flowerCenter} stroke={palette.wallCreamShade} strokeWidth="2" />
      <rect x="42" y="58" width="6" height="16" fill={palette.roofRed} />
      <rect x="49" y="56" width="6" height="18" fill={palette.roofBlue} />
      <rect x="56" y="59" width="6" height="15" fill={palette.flowerYellow} />
    </svg>
  );
}
