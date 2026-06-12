import { palette } from './palette';

/** 침대 */
export function BedObject({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="20" width="92" height="44" rx="6" fill={palette.woodDark} />
      <rect x="8" y="14" width="20" height="34" rx="4" fill="#FFFFFF" />
      <rect x="10" y="24" width="88" height="34" rx="6" fill="#FFF6E5" />
      <rect x="10" y="24" width="88" height="14" rx="6" fill={palette.flowerPurple} opacity="0.55" />
    </svg>
  );
}

/** 책상 */
export function DeskObject({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="38" width="80" height="10" rx="3" fill={palette.wood} />
      <rect x="16" y="48" width="8" height="40" fill={palette.woodDark} />
      <rect x="76" y="48" width="8" height="40" fill={palette.woodDark} />
      <rect x="30" y="14" width="26" height="22" rx="3" fill="#BFE3F5" stroke={palette.woodDark} strokeWidth="2" />
      <rect x="60" y="22" width="14" height="14" rx="2" fill={palette.flowerYellow} />
    </svg>
  );
}

/** 책장 */
export function BookshelfObject({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 80 88" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="76" height="84" rx="4" fill={palette.woodDark} />
      <rect x="8" y="8" width="64" height="22" fill={palette.wallCream} />
      <rect x="8" y="34" width="64" height="22" fill={palette.wallCream} />
      <rect x="8" y="60" width="64" height="22" fill={palette.wallCream} />
      {[12, 22, 32].map((x, i) => (
        <rect key={`a-${i}`} x={x} y="12" width="6" height="14" fill={[palette.roofRed, palette.roofBlue, palette.flowerYellow][i % 3]} />
      ))}
      {[44, 54, 64].map((x, i) => (
        <rect key={`b-${i}`} x={x} y="38" width="6" height="14" fill={[palette.leafMid, palette.flowerPurple, palette.roofRed][i % 3]} />
      ))}
      {[12, 22, 32, 42].map((x, i) => (
        <rect key={`c-${i}`} x={x} y="64" width="6" height="14" fill={[palette.roofBlue, palette.flowerYellow, palette.leafMid, palette.flowerPurple][i % 4]} />
      ))}
    </svg>
  );
}

/** 화분 */
export function PlantObject({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 46 H46 L42 68 H18 Z" fill="#D9A66C" />
      <circle cx="30" cy="32" r="16" fill={palette.leafMid} />
      <circle cx="18" cy="38" r="11" fill={palette.leafLight} />
      <circle cx="42" cy="38" r="11" fill={palette.leafDark} opacity="0.7" />
    </svg>
  );
}

/** 러그 (바닥 카펫) */
export function RugObject({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 160 88" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="156" height="84" rx="14" fill={palette.flowerPink} opacity="0.55" />
      <rect x="16" y="16" width="128" height="56" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.7" />
      <circle cx="80" cy="44" r="14" fill="#FFFFFF" opacity="0.5" />
    </svg>
  );
}

/** 실내 창문 — 커튼 포함 */
export function WindowObject({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="80" height="64" rx="6" fill={palette.water} stroke={palette.wallCreamShade} strokeWidth="4" />
      <line x1="50" y1="6" x2="50" y2="70" stroke={palette.wallCreamShade} strokeWidth="3" />
      <line x1="10" y1="38" x2="90" y2="38" stroke={palette.wallCreamShade} strokeWidth="3" />
      <path d="M6 4 Q4 40 14 72" stroke={palette.flowerPink} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M94 4 Q96 40 86 72" stroke={palette.flowerPink} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/** 의자 */
export function ChairObject({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="34" height="10" rx="3" fill={palette.woodDark} />
      <rect x="10" y="16" width="34" height="22" rx="3" fill={palette.wood} />
      <rect x="12" y="38" width="6" height="26" fill={palette.woodDark} />
      <rect x="36" y="38" width="6" height="26" fill={palette.woodDark} />
    </svg>
  );
}
