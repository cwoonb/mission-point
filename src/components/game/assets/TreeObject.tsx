import { palette } from './palette';

interface TreeObjectProps {
  variant?: 'round' | 'pine';
  size?: number;
}

/** 🌳 → SVG 나무 오브젝트 (둥근 활엽수 / 침엽수) */
export default function TreeObject({ variant = 'round', size = 48 }: TreeObjectProps) {
  if (variant === 'pine') {
    return (
      <svg width={size} height={size * 1.25} viewBox="0 0 100 125" xmlns="http://www.w3.org/2000/svg">
        <rect x="45" y="92" width="10" height="28" rx="3" fill={palette.trunk} />
        <path d="M50 6 L84 60 H68 L92 96 H8 L32 60 H16 Z" fill={palette.pineMid} />
        <path d="M50 32 L74 72 H62 L80 96 H50 Z" fill={palette.pineDark} opacity="0.35" />
        <path d="M50 6 L62 32 H38 Z" fill={palette.pineLight} opacity="0.6" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="68" width="10" height="38" rx="3" fill={palette.trunk} />
      <circle cx="50" cy="42" r="38" fill={palette.leafMid} />
      <circle cx="30" cy="36" r="22" fill={palette.leafLight} />
      <circle cx="70" cy="40" r="20" fill={palette.leafDark} opacity="0.45" />
    </svg>
  );
}
