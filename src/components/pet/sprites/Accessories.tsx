import type { PetRarity } from '../../../types';
import { RARITY_COLOR } from '../../../config/pets';
import type { Proportions } from './types';
import { starPath } from './starPath';

interface AccessoryProps {
  stageIndex: number;
  rarity: PetRarity;
  p: Proportions;
  dark: string;
}

/**
 * 진화 단계별 장신구.
 * 2단계: 목걸이(목띠), 3단계: 반다나, 4단계: 케이프, 5단계: 케이프 + 왕관.
 * (4~5단계는 rare 이상에서만 도달 가능)
 */
export function AccessoryLayer({ stageIndex, rarity, p, dark }: AccessoryProps) {
  const neckY = p.headCy + p.headR * 0.78;
  const accent = RARITY_COLOR[rarity].solid;

  return (
    <>
      {stageIndex >= 4 && (
        <path
          d={`M ${60 - p.bodyRx * 0.55} ${neckY + p.headR * 0.1}
              Q ${60 - p.bodyRx * 1.05} ${p.bodyCy + p.bodyRy * 0.9} ${60 - p.bodyRx * 0.3} ${p.bodyCy + p.bodyRy * 1.05}
              L ${60 + p.bodyRx * 0.3} ${p.bodyCy + p.bodyRy * 1.05}
              Q ${60 + p.bodyRx * 1.05} ${p.bodyCy + p.bodyRy * 0.9} ${60 + p.bodyRx * 0.55} ${neckY + p.headR * 0.1}
              Z`}
          fill={accent}
          opacity="0.85"
        />
      )}

      {stageIndex === 2 && (
        <g>
          <ellipse cx="60" cy={neckY} rx={p.headR * 0.82} ry={p.headR * 0.16} fill={accent} />
          <circle cx="60" cy={neckY + p.headR * 0.16} r={p.headR * 0.1} fill="#FFFFFF" stroke={dark} strokeWidth="1" />
        </g>
      )}

      {stageIndex === 3 && (
        <g>
          <path
            d={`M ${60 - p.headR * 0.85} ${neckY - p.headR * 0.08}
                Q 60 ${neckY + p.headR * 0.45} ${60 + p.headR * 0.85} ${neckY - p.headR * 0.08}
                L ${60 + p.headR * 0.5} ${neckY + p.headR * 0.05}
                Q 60 ${neckY + p.headR * 0.32} ${60 - p.headR * 0.5} ${neckY + p.headR * 0.05}
                Z`}
            fill={accent}
          />
          <path d={`M 60 ${neckY + p.headR * 0.3} l ${-p.headR * 0.16} ${p.headR * 0.4} l ${p.headR * 0.32} 0 Z`} fill={accent} opacity="0.85" />
        </g>
      )}

      {stageIndex >= 5 && (
        <g>
          <path
            d={`M ${60 - p.headR * 0.55} ${p.headCy - p.headR * 0.95}
                L ${60 - p.headR * 0.55} ${p.headCy - p.headR * 1.35}
                L ${60 - p.headR * 0.25} ${p.headCy - p.headR * 1.1}
                L 60 ${p.headCy - p.headR * 1.45}
                L ${60 + p.headR * 0.25} ${p.headCy - p.headR * 1.1}
                L ${60 + p.headR * 0.55} ${p.headCy - p.headR * 1.35}
                L ${60 + p.headR * 0.55} ${p.headCy - p.headR * 0.95}
                Z`}
            fill="#FFD54F"
            stroke="#E6A817"
            strokeWidth="1"
          />
          <circle cx="60" cy={p.headCy - p.headR * 1.08} r={p.headR * 0.08} fill={accent} />
        </g>
      )}
    </>
  );
}

/**
 * 희귀도 오라 효과.
 * magic: 부드러운 보라빛 원형 글로우, legendary: 더 큰 황금빛 글로우 + 주변 반짝임.
 */
export function RarityAura({ rarity, p }: { rarity: PetRarity; p: Proportions }) {
  if (rarity !== 'magic' && rarity !== 'legendary') return null;
  const id = `aura-${rarity}`;
  const color = RARITY_COLOR[rarity].solid;
  const radius = Math.max(p.bodyRx, p.bodyRy) * (rarity === 'legendary' ? 2.5 : 2.1);

  return (
    <>
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="60" cy={(p.headCy + p.bodyCy) / 2} r={radius} fill={`url(#${id})`} />
      {rarity === 'legendary' && (
        <g fill="#FFD54F">
          <path d={starPath(60 - p.bodyRx * 1.7, p.bodyCy - p.bodyRy * 0.9, p.headR * 0.16)} opacity="0.9" />
          <path d={starPath(60 + p.bodyRx * 1.75, p.bodyCy - p.bodyRy * 0.4, p.headR * 0.12)} opacity="0.8" />
          <path d={starPath(60 + p.bodyRx * 1.4, p.headCy - p.headR * 1.3, p.headR * 0.1)} opacity="0.75" />
          <path d={starPath(60 - p.bodyRx * 1.3, p.headCy - p.headR * 1.2, p.headR * 0.13)} opacity="0.85" />
        </g>
      )}
    </>
  );
}
