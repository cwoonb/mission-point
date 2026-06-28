import type { PetRarity } from '../../types';
import { shade, tint } from '../../utils/color';
import { starPath } from './sprites/starPath';

const EGG_BASE: Record<PetRarity, string> = {
  common: '#FFF6E5',
  rare: '#CDE7FF',
  magic: '#E6D6FF',
  legendary: '#FFE8B8',
};

const EGG_PATH =
  'M 60 14 C 88 14 98 56 98 76 C 98 102 81 113 60 113 C 39 113 22 102 22 76 C 22 56 32 14 60 14 Z';

interface EggSpriteProps {
  rarity: PetRarity;
  className?: string;
}

/** 희귀도별 알 디자인 (부화 전 표시) */
export function EggSprite({ rarity, className }: EggSpriteProps) {
  const base = EGG_BASE[rarity];
  const dark = shade(base, 0.12);
  const light = tint(base, 0.5);

  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="egg">
      {(rarity === 'magic' || rarity === 'legendary') && (
        <defs>
          <radialGradient id={`egg-aura-${rarity}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={rarity === 'legendary' ? '#FFD54F' : '#C9A6FF'} stopOpacity="0.5" />
            <stop offset="100%" stopColor={rarity === 'legendary' ? '#FFD54F' : '#C9A6FF'} stopOpacity="0" />
          </radialGradient>
        </defs>
      )}

      {(rarity === 'magic' || rarity === 'legendary') && (
        <circle cx="60" cy="64" r={rarity === 'legendary' ? 56 : 50} fill={`url(#egg-aura-${rarity})`} />
      )}

      <path d={EGG_PATH} fill={base} stroke={dark} strokeWidth="2" />
      <path d="M 30 78 C 30 100 43 109 60 109 C 77 109 90 100 90 78 C 90 96 76 104 60 104 C 44 104 30 96 30 78 Z" fill={dark} opacity="0.18" />
      <ellipse cx="44" cy="38" rx="11" ry="15" fill={light} opacity="0.7" transform="rotate(-20 44 38)" />

      {rarity === 'common' && (
        <g fill={shade(base, 0.18)} opacity="0.5">
          <circle cx="48" cy="58" r="4" />
          <circle cx="72" cy="50" r="3" />
          <circle cx="66" cy="78" r="5" />
          <circle cx="44" cy="86" r="3" />
        </g>
      )}

      {rarity === 'rare' && (
        <g fill="#FFFFFF" opacity="0.85">
          <path d={starPath(60, 50, 9)} />
          <path d={starPath(42, 76, 6)} />
          <path d={starPath(78, 80, 6)} />
        </g>
      )}

      {rarity === 'magic' && (
        <g fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.75">
          <path d="M 38 56 Q 60 46 60 64 Q 60 82 82 72" />
          <circle cx="38" cy="56" r="2.5" fill="#FFFFFF" stroke="none" />
          <circle cx="82" cy="72" r="2.5" fill="#FFFFFF" stroke="none" />
        </g>
      )}

      {rarity === 'legendary' && (
        <g>
          <path d="M 60 30 C 75 30 85 50 85 66 C 85 86 74 96 60 96 C 46 96 35 86 35 66 C 35 50 45 30 60 30 Z" fill="none" stroke="#FFD54F" strokeWidth="3" opacity="0.6" />
          <g fill="#FFFFFF">
            <path d={starPath(60, 46, 8)} />
            <path d={starPath(40, 70, 6)} />
            <path d={starPath(80, 64, 6)} />
            <path d={starPath(66, 90, 5)} />
          </g>
        </g>
      )}
    </svg>
  );
}
