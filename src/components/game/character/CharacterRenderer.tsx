import type { EyeShape, HairStyle } from '../../../types';

/** SD 캐릭터 SVG 좌표계: viewBox 0 0 100 104 */
export const CHARACTER_VIEWBOX = '0 0 100 104';
export const CHARACTER_ASPECT = 104 / 100;

function starPath(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push(`${cx + radius * Math.sin(angle)},${cy - radius * Math.cos(angle)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** 하의 레이어 — 다리 */
export function BottomLayer({ color }: { color: string }) {
  return (
    <>
      <rect x="37" y="64" width="11" height="24" rx="4" fill={color} />
      <rect x="52" y="64" width="11" height="24" rx="4" fill={color} />
    </>
  );
}

/** 신발 레이어 — 양말 + 신발 */
export function ShoesLayer({ color, socksColor }: { color: string; socksColor?: string }) {
  return (
    <>
      {socksColor && (
        <>
          <rect x="37" y="80" width="11" height="6" fill={socksColor} />
          <rect x="52" y="80" width="11" height="6" fill={socksColor} />
        </>
      )}
      <ellipse cx="42.5" cy="92" rx="9" ry="5" fill={color} />
      <ellipse cx="57.5" cy="92" rx="9" ry="5" fill={color} />
    </>
  );
}

/** 상의 레이어 — 팔 + 몸통 + 장갑 */
export function TopLayer({ color, glovesColor }: { color: string; glovesColor?: string }) {
  return (
    <>
      <rect x="21" y="46" width="11" height="24" rx="5" fill={color} />
      <rect x="68" y="46" width="11" height="24" rx="5" fill={color} />
      {glovesColor && (
        <>
          <rect x="21" y="64" width="11" height="6" rx="2" fill={glovesColor} />
          <rect x="68" y="64" width="11" height="6" rx="2" fill={glovesColor} />
        </>
      )}
      <rect x="32" y="42" width="36" height="30" rx="11" fill={color} />
    </>
  );
}

/** 얼굴 레이어 — 눈/볼/입/안경 */
export function FaceLayer({ eyeShape, glassesColor }: { eyeShape: EyeShape; glassesColor?: string }) {
  let eyes: React.ReactNode;
  switch (eyeShape) {
    case 'happy':
      eyes = (
        <>
          <path d="M37 24 Q41 19 45 24" stroke="#3A2C20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M55 24 Q59 19 63 24" stroke="#3A2C20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
      break;
    case 'sleepy':
      eyes = (
        <>
          <path d="M37 24 H45" stroke="#3A2C20" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M55 24 H63" stroke="#3A2C20" strokeWidth="2.4" strokeLinecap="round" />
        </>
      );
      break;
    case 'star':
      eyes = (
        <>
          <path d={starPath(41, 24, 3.4)} fill="#3A2C20" />
          <path d={starPath(59, 24, 3.4)} fill="#3A2C20" />
        </>
      );
      break;
    default:
      eyes = (
        <>
          <circle cx="41" cy="24" r="2.6" fill="#3A2C20" />
          <circle cx="59" cy="24" r="2.6" fill="#3A2C20" />
        </>
      );
  }

  return (
    <>
      <ellipse cx="36" cy="32" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.6" />
      <ellipse cx="64" cy="32" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.6" />
      {eyes}
      <ellipse cx="50" cy="35" rx="3.2" ry="1.6" fill="#FB7185" opacity="0.75" />
      {glassesColor && (
        <>
          <rect x="34" y="19" width="14" height="10" rx="3" fill="none" stroke={glassesColor} strokeWidth="2" />
          <rect x="52" y="19" width="14" height="10" rx="3" fill="none" stroke={glassesColor} strokeWidth="2" />
          <line x1="48" y1="23" x2="52" y2="23" stroke={glassesColor} strokeWidth="2" />
        </>
      )}
    </>
  );
}

/** 머리(헤어) 레이어 — 5가지 스타일 */
export function HairLayer({ style, color }: { style: HairStyle; color: string }) {
  switch (style) {
    case 'long':
      return (
        <>
          <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />
          <rect x="19" y="14" width="9" height="38" rx="4" fill={color} />
          <rect x="72" y="14" width="9" height="38" rx="4" fill={color} />
        </>
      );
    case 'ponytail':
      return (
        <>
          <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />
          <ellipse cx="79" cy="28" rx="8" ry="11" fill={color} />
        </>
      );
    case 'curly':
      return (
        <>
          <ellipse cx="50" cy="15" rx="26" ry="16" fill={color} />
          <circle cx="28" cy="10" r="9" fill={color} />
          <circle cx="50" cy="5" r="9" fill={color} />
          <circle cx="72" cy="10" r="9" fill={color} />
        </>
      );
    case 'bowl':
      return <ellipse cx="50" cy="18" rx="27" ry="23" fill={color} />;
    case 'short':
    default:
      return <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />;
  }
}

export interface CharacterRendererProps {
  size?: number;
  skinColor: string;
  hairStyle: HairStyle;
  hairColor: string;
  eyeShape: EyeShape;
  topColor: string;
  bottomColor: string;
  shoesColor: string;
  socksColor?: string;
  glovesColor?: string;
  hatColor?: string;
  glassesColor?: string;
  bagColor?: string;
  className?: string;
}

/**
 * SD 스타일 캐릭터를 SVG 레이어로 합성한다.
 * 합성 순서: 가방 → 하의 → 신발 → 상의(팔+몸통) → 머리(피부) → 얼굴 → 머리(헤어) → 모자
 */
export default function CharacterRenderer({
  size = 96,
  skinColor,
  hairStyle,
  hairColor,
  eyeShape,
  topColor,
  bottomColor,
  shoesColor,
  socksColor,
  glovesColor,
  hatColor,
  glassesColor,
  bagColor,
  className = '',
}: CharacterRendererProps) {
  const width = size;
  const height = size * CHARACTER_ASPECT;

  return (
    <svg width={width} height={height} viewBox={CHARACTER_VIEWBOX} className={className} style={{ display: 'block', overflow: 'visible' }}>
      {bagColor && <rect x="11" y="48" width="13" height="20" rx="5" fill={bagColor} />}
      <BottomLayer color={bottomColor} />
      <ShoesLayer color={shoesColor} socksColor={socksColor} />
      <TopLayer color={topColor} glovesColor={glovesColor} />
      <circle cx="50" cy="24" r="24" fill={skinColor} />
      <FaceLayer eyeShape={eyeShape} glassesColor={glassesColor} />
      <HairLayer style={hairStyle} color={hairColor} />
      {hatColor && <path d="M24 6 Q50 -12 76 6 L76 16 Q50 4 24 16 Z" fill={hatColor} />}
    </svg>
  );
}
