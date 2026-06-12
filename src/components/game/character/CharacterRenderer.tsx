import { motion } from 'framer-motion';
import type { EyeShape, HairStyle } from '../../../types';
import { shade, tint } from '../assets/palette';
import GroundShadow from '../assets/Shadow';

/** SD 캐릭터 SVG 좌표계: viewBox 0 0 100 108 (2.3~2.4 head 비율) */
export const CHARACTER_VIEWBOX = '0 0 100 108';
export const CHARACTER_ASPECT = 108 / 100;

const WALK_DURATION = 0.42;

function starPath(cx: number, cy: number, r: number) {
  const points: string[] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i;
    const radius = i % 2 === 0 ? r : r * 0.4;
    points.push(`${cx + radius * Math.sin(angle)},${cy - radius * Math.cos(angle)}`);
  }
  return `M${points.join(' L')} Z`;
}

/** 걷기 애니메이션 — 다리/팔을 위아래로 교차 바운스 */
function legMotion(phase: 'a' | 'b', walking?: boolean) {
  const lift = phase === 'a' ? [0, -3, 0] : [0, 3, 0];
  return {
    animate: { y: walking ? lift : 0 },
    transition: walking ? { duration: WALK_DURATION, repeat: Infinity, ease: 'easeInOut' as const, delay: phase === 'b' ? WALK_DURATION / 2 : 0 } : undefined,
  };
}

/** 하의 레이어 — 다리, 2단 명암 + 걷기 시 교차 바운스 */
export function BottomLayer({ color, walking }: { color: string; walking?: boolean }) {
  const light = tint(color, 0.18);
  const dark = shade(color, 0.18);
  return (
    <>
      <motion.g {...legMotion('a', walking)}>
        <rect x="37" y="70" width="11" height="26" rx="4" fill={color} />
        <rect x="37" y="70" width="4" height="26" rx="2" fill={light} opacity="0.5" />
        <rect x="44" y="70" width="4" height="26" rx="2" fill={dark} opacity="0.3" />
      </motion.g>
      <motion.g {...legMotion('b', walking)}>
        <rect x="52" y="70" width="11" height="26" rx="4" fill={color} />
        <rect x="52" y="70" width="4" height="26" rx="2" fill={light} opacity="0.5" />
        <rect x="59" y="70" width="4" height="26" rx="2" fill={dark} opacity="0.3" />
      </motion.g>
    </>
  );
}

/** 신발 레이어 — 양말 + 신발, 다리와 동기화된 바운스 */
export function ShoesLayer({ color, socksColor, walking }: { color: string; socksColor?: string; walking?: boolean }) {
  const light = tint(color, 0.2);
  const dark = shade(color, 0.2);
  return (
    <>
      <motion.g {...legMotion('a', walking)}>
        {socksColor && <rect x="37" y="88" width="11" height="6" fill={socksColor} />}
        <ellipse cx="42.5" cy="98" rx="9" ry="5" fill={color} />
        <ellipse cx="41.5" cy="95.5" rx="6" ry="2.2" fill={light} opacity="0.6" />
        <ellipse cx="44.5" cy="100.5" rx="6" ry="2" fill={dark} opacity="0.4" />
      </motion.g>
      <motion.g {...legMotion('b', walking)}>
        {socksColor && <rect x="52" y="88" width="11" height="6" fill={socksColor} />}
        <ellipse cx="57.5" cy="98" rx="9" ry="5" fill={color} />
        <ellipse cx="56.5" cy="95.5" rx="6" ry="2.2" fill={light} opacity="0.6" />
        <ellipse cx="59.5" cy="100.5" rx="6" ry="2" fill={dark} opacity="0.4" />
      </motion.g>
    </>
  );
}

/** 상의 레이어 — 팔(다리와 교차 동기화) + 몸통 + 장갑, 2단 명암 */
export function TopLayer({ color, glovesColor, walking }: { color: string; glovesColor?: string; walking?: boolean }) {
  const light = tint(color, 0.18);
  const dark = shade(color, 0.16);
  return (
    <>
      {/* 팔은 반대쪽 다리와 같은 위상으로 흔들어 자연스러운 보행감을 준다 */}
      <motion.g {...legMotion('b', walking)}>
        <rect x="21" y="46" width="11" height="28" rx="5" fill={color} />
        <rect x="21" y="46" width="4" height="28" rx="2" fill={light} opacity="0.45" />
        {glovesColor && <rect x="21" y="68" width="11" height="6" rx="2" fill={glovesColor} />}
      </motion.g>
      <motion.g {...legMotion('a', walking)}>
        <rect x="68" y="46" width="11" height="28" rx="5" fill={color} />
        <rect x="75" y="46" width="4" height="28" rx="2" fill={dark} opacity="0.35" />
        {glovesColor && <rect x="68" y="68" width="11" height="6" rx="2" fill={glovesColor} />}
      </motion.g>
      {/* 몸통 */}
      <rect x="32" y="42" width="36" height="32" rx="11" fill={color} />
      <rect x="32" y="42" width="36" height="11" rx="11" fill={light} opacity="0.35" />
      <rect x="32" y="65" width="36" height="9" rx="6" fill={dark} opacity="0.28" />
    </>
  );
}

/** 얼굴 레이어 — 피부 음영 + 눈/볼/입/안경 */
export function FaceLayer({ eyeShape, skinColor, glassesColor }: { eyeShape: EyeShape; skinColor: string; glassesColor?: string }) {
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
          <circle cx="42" cy="23" r="0.9" fill="#FFFFFF" />
          <circle cx="60" cy="23" r="0.9" fill="#FFFFFF" />
        </>
      );
  }

  return (
    <>
      {/* 얼굴 입체감 — 좌상단 하이라이트 / 우하단 음영 */}
      <ellipse cx="40" cy="14" rx="16" ry="11" fill={tint(skinColor, 0.22)} opacity="0.55" />
      <ellipse cx="60" cy="34" rx="17" ry="12" fill={shade(skinColor, 0.12)} opacity="0.45" />
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

/** 머리(헤어) 레이어 — 5가지 스타일, 입체감을 위한 음영 포함 */
export function HairLayer({ style, color }: { style: HairStyle; color: string }) {
  const dark = shade(color, 0.18);
  const light = tint(color, 0.2);
  switch (style) {
    case 'long':
      return (
        <>
          <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />
          <rect x="19" y="14" width="9" height="38" rx="4" fill={color} />
          <rect x="72" y="14" width="9" height="38" rx="4" fill={color} />
          <rect x="76" y="14" width="5" height="38" rx="2.5" fill={dark} opacity="0.4" />
          <ellipse cx="60" cy="24" rx="16" ry="9" fill={dark} opacity="0.3" />
          <ellipse cx="40" cy="6" rx="13" ry="6" fill={light} opacity="0.45" />
        </>
      );
    case 'ponytail':
      return (
        <>
          <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />
          <ellipse cx="79" cy="28" rx="8" ry="11" fill={color} />
          <ellipse cx="81" cy="32" rx="4" ry="8" fill={dark} opacity="0.35" />
          <ellipse cx="60" cy="24" rx="16" ry="9" fill={dark} opacity="0.3" />
          <ellipse cx="40" cy="6" rx="13" ry="6" fill={light} opacity="0.45" />
        </>
      );
    case 'curly':
      return (
        <>
          <ellipse cx="50" cy="15" rx="26" ry="16" fill={color} />
          <circle cx="28" cy="10" r="9" fill={color} />
          <circle cx="50" cy="5" r="9" fill={color} />
          <circle cx="72" cy="10" r="9" fill={color} />
          <circle cx="72" cy="10" r="9" fill={dark} opacity="0.22" />
          <ellipse cx="60" cy="22" rx="14" ry="8" fill={dark} opacity="0.28" />
          <ellipse cx="34" cy="4" rx="8" ry="4" fill={light} opacity="0.5" />
        </>
      );
    case 'bowl':
      return (
        <>
          <ellipse cx="50" cy="18" rx="27" ry="23" fill={color} />
          <ellipse cx="60" cy="26" rx="17" ry="13" fill={dark} opacity="0.28" />
          <ellipse cx="40" cy="8" rx="13" ry="7" fill={light} opacity="0.45" />
        </>
      );
    case 'short':
    default:
      return (
        <>
          <ellipse cx="50" cy="14" rx="27" ry="18" fill={color} />
          <ellipse cx="60" cy="22" rx="15" ry="9" fill={dark} opacity="0.28" />
          <ellipse cx="40" cy="6" rx="13" ry="6" fill={light} opacity="0.45" />
        </>
      );
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
  walking?: boolean;
  showShadow?: boolean;
  className?: string;
}

/**
 * SD 스타일 캐릭터를 SVG 레이어로 합성한다.
 * 합성 순서: 그림자 → 가방 → 하의 → 신발 → 상의(팔+몸통) → 머리(피부) → 얼굴 → 머리(헤어) → 모자
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
  walking = false,
  showShadow = true,
  className = '',
}: CharacterRendererProps) {
  const width = size;
  const height = size * CHARACTER_ASPECT;
  const skinShade = shade(skinColor, 0.12);
  const skinLight = tint(skinColor, 0.18);

  return (
    <svg width={width} height={height} viewBox={CHARACTER_VIEWBOX} className={className} style={{ display: 'block', overflow: 'visible' }}>
      {showShadow && <GroundShadow cx={50} cy={104} rx={20} ry={4.2} opacity={0.18} />}
      {bagColor && <rect x="11" y="48" width="13" height="24" rx="5" fill={bagColor} />}
      <BottomLayer color={bottomColor} walking={walking} />
      <ShoesLayer color={shoesColor} socksColor={socksColor} walking={walking} />
      <TopLayer color={topColor} glovesColor={glovesColor} walking={walking} />
      <circle cx="50" cy="24" r="24" fill={skinColor} />
      <ellipse cx="42" cy="14" rx="14" ry="9" fill={skinLight} opacity="0.4" />
      <ellipse cx="58" cy="34" rx="15" ry="10" fill={skinShade} opacity="0.35" />
      <FaceLayer eyeShape={eyeShape} skinColor={skinColor} glassesColor={glassesColor} />
      <HairLayer style={hairStyle} color={hairColor} />
      {hatColor && (
        <>
          <path d="M24 6 Q50 -12 76 6 L76 16 Q50 4 24 16 Z" fill={hatColor} />
          <path d="M24 6 Q50 -12 76 6 L76 10 Q50 -2 24 10 Z" fill={tint(hatColor, 0.22)} opacity="0.5" />
        </>
      )}
    </svg>
  );
}
