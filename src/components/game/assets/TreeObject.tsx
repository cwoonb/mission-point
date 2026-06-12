import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

interface TreeObjectProps {
  variant?: 'round' | 'pine';
  size?: number;
}

/** 나무 오브젝트 — 뭉치형 활엽수 / 침엽수, 2단 명암 + 그림자 + 잎 텍스처 */
export default function TreeObject({ variant = 'round', size = 48 }: TreeObjectProps) {
  if (variant === 'pine') {
    const mid = palette.pineMid;
    const dark = shade(mid, 0.28);
    const light = tint(mid, 0.22);
    return (
      <svg width={size} height={size * 1.25} viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
        <GroundShadow cx={50} cy={119} rx={26} ry={6} />
        <rect x="44" y="90" width="12" height="26" rx="3" fill={palette.trunk} />
        <rect x="44" y="90" width="4" height="26" fill={tint(palette.trunk, 0.25)} opacity="0.6" />
        {/* 3단 침엽 덩어리 — 아래일수록 크고 진함 */}
        <path d="M50 64 L82 100 H18 Z" fill={dark} />
        <path d="M50 64 L78 98 H22 Z" fill={mid} />
        <path d="M50 64 L60 86 H40 Z" fill={light} opacity="0.55" />
        <path d="M50 36 L72 70 H28 Z" fill={dark} />
        <path d="M50 36 L68 68 H32 Z" fill={mid} />
        <path d="M50 36 L58 56 H42 Z" fill={light} opacity="0.55" />
        <path d="M50 10 L66 42 H34 Z" fill={dark} />
        <path d="M50 10 L62 40 H38 Z" fill={mid} />
        <path d="M50 10 L57 26 H43 Z" fill={light} opacity="0.6" />
        {/* 작은 눈/잎 텍스처 점 */}
        <circle cx="40" cy="60" r="2" fill={light} opacity="0.5" />
        <circle cx="60" cy="80" r="2.4" fill={light} opacity="0.45" />
        <circle cx="46" cy="32" r="1.6" fill={light} opacity="0.5" />
      </svg>
    );
  }

  const mid = palette.leafMid;
  const dark = shade(mid, 0.3);
  const light = tint(palette.leafLight, 0.2);
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={104} rx={28} ry={7} />
      <rect x="44" y="68" width="12" height="34" rx="3" fill={palette.trunk} />
      <rect x="44" y="68" width="4" height="34" fill={tint(palette.trunk, 0.3)} opacity="0.6" />
      <path d="M44 68 L48 80 L52 68 Z" fill={shade(palette.trunk, 0.25)} />
      {/* 뭉치형 캐노피 — 여러 원이 겹쳐 입체감 있는 덩어리를 만든다 */}
      <circle cx="50" cy="44" r="36" fill={dark} />
      <circle cx="34" cy="38" r="24" fill={mid} />
      <circle cx="62" cy="40" r="26" fill={mid} />
      <circle cx="48" cy="28" r="24" fill={mid} />
      <circle cx="38" cy="28" r="15" fill={light} opacity="0.7" />
      <circle cx="58" cy="50" r="14" fill={dark} opacity="0.45" />
      {/* 잎 텍스처 점 */}
      <circle cx="30" cy="46" r="2.2" fill={dark} opacity="0.35" />
      <circle cx="66" cy="50" r="2.6" fill={dark} opacity="0.3" />
      <circle cx="44" cy="20" r="2" fill={light} opacity="0.6" />
      <circle cx="58" cy="24" r="1.8" fill={light} opacity="0.5" />
    </svg>
  );
}
