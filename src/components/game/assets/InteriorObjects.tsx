import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

/** 침대 — 프레임/이불/베개에 2단 명암 + 바닥 그림자 */
export function BedObject({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 100 70" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={67} rx={46} ry={5} opacity={0.16} />
      <rect x="4" y="20" width="92" height="44" rx="6" fill={palette.woodDark} />
      <rect x="4" y="20" width="92" height="6" rx="3" fill={tint(palette.woodDark, 0.2)} opacity="0.6" />
      <rect x="8" y="14" width="20" height="34" rx="4" fill="#FFFFFF" />
      <rect x="8" y="14" width="20" height="10" rx="4" fill={shade('#FFFFFF', 0.08)} opacity="0.5" />
      <rect x="10" y="24" width="88" height="34" rx="6" fill="#FFF6E5" />
      <rect x="10" y="24" width="88" height="14" rx="6" fill={palette.flowerPurple} opacity="0.55" />
      <rect x="10" y="50" width="88" height="8" rx="4" fill={shade('#FFF6E5', 0.08)} opacity="0.5" />
    </svg>
  );
}

/** 책상 — 상판/다리/모니터에 2단 명암 + 바닥 그림자 */
export function DeskObject({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={90} rx={42} ry={5} opacity={0.16} />
      <rect x="16" y="48" width="8" height="40" fill={palette.woodDark} />
      <rect x="76" y="48" width="8" height="40" fill={palette.woodDark} />
      <rect x="16" y="48" width="3" height="40" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="76" y="48" width="3" height="40" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="10" y="38" width="80" height="10" rx="3" fill={palette.wood} />
      <rect x="10" y="38" width="80" height="3" fill={tint(palette.wood, 0.2)} opacity="0.7" />
      <rect x="10" y="45" width="80" height="3" fill={shade(palette.wood, 0.16)} opacity="0.5" />
      <rect x="30" y="14" width="26" height="22" rx="3" fill="#BFE3F5" stroke={palette.woodDark} strokeWidth="2" />
      <path d={`M32 16 L52 16 L40 34 L32 34 Z`} fill="#FFFFFF" opacity="0.3" />
      <rect x="60" y="22" width="14" height="14" rx="2" fill={palette.flowerYellow} />
      <rect x="60" y="22" width="14" height="5" rx="2" fill={tint(palette.flowerYellow, 0.25)} opacity="0.7" />
    </svg>
  );
}

/** 책장 — 칸별 음영 + 책 하이라이트 + 바닥 그림자 */
export function BookshelfObject({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 80 88" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={40} cy={86} rx={36} ry={4} opacity={0.16} />
      <rect x="2" y="2" width="76" height="84" rx="4" fill={palette.woodDark} />
      <rect x="2" y="2" width="76" height="6" rx="3" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      {[8, 34, 60].map((y) => (
        <g key={y}>
          <rect x="8" y={y} width="64" height="22" fill={palette.wallCream} />
          <rect x="8" y={y + 17} width="64" height="5" fill={shade(palette.wallCream, 0.1)} opacity="0.5" />
        </g>
      ))}
      {[12, 22, 32].map((x, i) => (
        <g key={`a-${i}`}>
          <rect x={x} y="12" width="6" height="14" fill={[palette.roofRed, palette.roofBlue, palette.flowerYellow][i % 3]} />
          <rect x={x} y="12" width="2" height="14" fill={tint([palette.roofRed, palette.roofBlue, palette.flowerYellow][i % 3], 0.25)} opacity="0.6" />
        </g>
      ))}
      {[44, 54, 64].map((x, i) => (
        <g key={`b-${i}`}>
          <rect x={x} y="38" width="6" height="14" fill={[palette.leafMid, palette.flowerPurple, palette.roofRed][i % 3]} />
          <rect x={x} y="38" width="2" height="14" fill={tint([palette.leafMid, palette.flowerPurple, palette.roofRed][i % 3], 0.25)} opacity="0.6" />
        </g>
      ))}
      {[12, 22, 32, 42].map((x, i) => (
        <g key={`c-${i}`}>
          <rect x={x} y="64" width="6" height="14" fill={[palette.roofBlue, palette.flowerYellow, palette.leafMid, palette.flowerPurple][i % 4]} />
          <rect x={x} y="64" width="2" height="14" fill={tint([palette.roofBlue, palette.flowerYellow, palette.leafMid, palette.flowerPurple][i % 4], 0.25)} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
}

/** 화분 — 잎/화분에 음영 + 바닥 그림자 */
export function PlantObject({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={30} cy={68} rx={22} ry={4} opacity={0.16} />
      <path d="M14 46 H46 L42 68 H18 Z" fill="#D9A66C" />
      <path d="M14 46 H46 L44 54 H16 Z" fill={tint('#D9A66C', 0.2)} opacity="0.6" />
      <circle cx="30" cy="32" r="16" fill={palette.leafMid} />
      <circle cx="18" cy="38" r="11" fill={palette.leafLight} />
      <circle cx="42" cy="38" r="11" fill={palette.leafDark} opacity="0.7" />
      <ellipse cx="24" cy="26" rx="7" ry="4.5" fill={tint(palette.leafLight, 0.2)} opacity="0.6" />
    </svg>
  );
}

/** 러그 (바닥 카펫) — 패턴 + 테두리 음영 */
export function RugObject({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.55} viewBox="0 0 160 88" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="156" height="84" rx="14" fill={palette.flowerPink} opacity="0.55" />
      <rect x="2" y="68" width="156" height="18" rx="10" fill={shade(palette.flowerPink, 0.15)} opacity="0.35" />
      <rect x="16" y="16" width="128" height="56" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.7" />
      <circle cx="80" cy="44" r="14" fill="#FFFFFF" opacity="0.5" />
      <circle cx="80" cy="44" r="6" fill={tint(palette.flowerPink, 0.3)} opacity="0.7" />
    </svg>
  );
}

/** 실내 창문 — 유리 그라데이션 + 커튼 음영 */
export function WindowObject({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="6" width="80" height="64" rx="6" fill={palette.water} stroke={palette.wallCreamShade} strokeWidth="4" />
      <rect x="10" y="6" width="80" height="30" rx="6" fill={tint(palette.water, 0.2)} opacity="0.6" />
      <rect x="10" y="44" width="80" height="26" fill={shade(palette.water, 0.1)} opacity="0.35" />
      <line x1="50" y1="6" x2="50" y2="70" stroke={palette.wallCreamShade} strokeWidth="3" />
      <line x1="10" y1="38" x2="90" y2="38" stroke={palette.wallCreamShade} strokeWidth="3" />
      <path d="M6 4 Q4 40 14 72" stroke={palette.flowerPink} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M94 4 Q96 40 86 72" stroke={palette.flowerPink} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M6 4 Q4 40 14 72" stroke={shade(palette.flowerPink, 0.15)} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M94 4 Q96 40 86 72" stroke={tint(palette.flowerPink, 0.25)} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** 의자 — 좌판/등받이/다리에 2단 명암 + 바닥 그림자 */
export function ChairObject({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 60 70" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={29} cy={67} rx={20} ry={4} opacity={0.16} />
      <rect x="12" y="38" width="6" height="26" fill={palette.woodDark} />
      <rect x="36" y="38" width="6" height="26" fill={palette.woodDark} />
      <rect x="12" y="38" width="2" height="26" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="36" y="38" width="2" height="26" fill={tint(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="10" y="6" width="34" height="10" rx="3" fill={palette.woodDark} />
      <rect x="10" y="6" width="34" height="3" rx="2" fill={tint(palette.woodDark, 0.2)} opacity="0.6" />
      <rect x="10" y="16" width="34" height="22" rx="3" fill={palette.wood} />
      <rect x="10" y="16" width="34" height="5" rx="3" fill={tint(palette.wood, 0.2)} opacity="0.6" />
      <rect x="10" y="32" width="34" height="6" rx="3" fill={shade(palette.wood, 0.16)} opacity="0.5" />
    </svg>
  );
}
