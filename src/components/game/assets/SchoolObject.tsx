import { palette } from './palette';

/** 학교 — 마을의 교육 시설 */
export default function SchoolObject({ size = 76 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="46" width="100" height="60" rx="6" fill={palette.wallCream} />
      <path d="M4 46 L60 10 L116 46 Z" fill={palette.roofBlue} />
      <path d="M60 10 L92 30 L60 30 Z" fill={palette.roofBlueShade} opacity="0.4" />
      <rect x="52" y="70" width="16" height="36" fill={palette.woodDark} />
      <rect x="22" y="58" width="18" height="18" rx="3" fill="#BFE3F5" stroke={palette.wallCreamShade} strokeWidth="2" />
      <rect x="80" y="58" width="18" height="18" rx="3" fill="#BFE3F5" stroke={palette.wallCreamShade} strokeWidth="2" />
      <rect x="57" y="2" width="4" height="14" fill={palette.woodDark} />
      <path d="M61 2 L82 8 L61 14 Z" fill={palette.roofRed} />
    </svg>
  );
}
