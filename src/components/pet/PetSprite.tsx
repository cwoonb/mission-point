import type { PetRarity, PetSpecies } from '../../types';
import { MAX_STAGE } from '../../config/pets';
import { shade, tint } from '../../utils/color';
import { AccessoryLayer, RarityAura } from './sprites/Accessories';
import { SPECIES_PALETTE, SpeciesBack, SpeciesEars, SpeciesFace } from './sprites/creatures';
import type { Proportions } from './sprites/types';
import { EggSprite } from './EggSprite';

interface PetSpriteProps {
  species: PetSpecies;
  rarity: PetRarity;
  /** 0 = 알(미부화), 1 ~ MAX_STAGE[rarity] = 부화 후 진화 단계 */
  stageIndex: number;
  hatched: boolean;
  className?: string;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function getProportions(stageIndex: number, maxStage: number): Proportions {
  const t = maxStage > 1 ? (Math.max(stageIndex, 1) - 1) / (maxStage - 1) : 1;
  return {
    scale: lerp(0.62, 1.0, t),
    headR: lerp(31, 27, t),
    bodyRx: lerp(23, 40, t),
    bodyRy: lerp(18, 32, t),
    bodyCy: lerp(87, 79, t),
    headCy: lerp(48, 39, t),
  };
}

/** 종 + 희귀도 + 진화 단계에 따라 알/동물 SVG를 그리는 메인 컴포넌트 */
export function PetSprite({ species, rarity, stageIndex, hatched, className }: PetSpriteProps) {
  if (!hatched || stageIndex <= 0) {
    return <EggSprite rarity={rarity} className={className} />;
  }

  const maxStage = MAX_STAGE[rarity];
  const p = getProportions(stageIndex, maxStage);
  const palette = SPECIES_PALETTE[species];
  const dark = shade(palette.body, 0.18);
  const light = tint(palette.body, 0.3);
  const shapeProps = { p, palette, dark, light };

  const eyeR = p.headR * 0.16;
  const eyeDx = p.headR * 0.4;
  const eyeY = p.headCy - p.headR * 0.05;

  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={species}>
      <RarityAura rarity={rarity} p={p} />

      <SpeciesBack species={species} {...shapeProps} />

      <ellipse cx="60" cy={p.bodyCy} rx={p.bodyRx} ry={p.bodyRy} fill={palette.body} stroke={dark} strokeWidth="1.5" />
      <ellipse cx="60" cy={p.bodyCy + p.bodyRy * 0.32} rx={p.bodyRx * 0.62} ry={p.bodyRy * 0.45} fill={palette.belly} />

      <SpeciesEars species={species} {...shapeProps} />

      <circle cx="60" cy={p.headCy} r={p.headR} fill={palette.body} stroke={dark} strokeWidth="1.5" />
      <circle cx={60 - p.headR * 0.35} cy={p.headCy - p.headR * 0.5} r={p.headR * 0.35} fill={light} opacity="0.5" />

      <SpeciesFace species={species} {...shapeProps} />

      {/* 눈 */}
      <circle cx={60 - eyeDx} cy={eyeY} r={eyeR} fill="#3A3633" />
      <circle cx={60 + eyeDx} cy={eyeY} r={eyeR} fill="#3A3633" />
      <circle cx={60 - eyeDx - eyeR * 0.35} cy={eyeY - eyeR * 0.35} r={eyeR * 0.32} fill="#FFFFFF" />
      <circle cx={60 + eyeDx - eyeR * 0.35} cy={eyeY - eyeR * 0.35} r={eyeR * 0.32} fill="#FFFFFF" />

      {/* 볼터치 */}
      <ellipse cx={60 - p.headR * 0.62} cy={p.headCy + p.headR * 0.35} rx={p.headR * 0.18} ry={p.headR * 0.1} fill="#FFAFC0" opacity="0.6" />
      <ellipse cx={60 + p.headR * 0.62} cy={p.headCy + p.headR * 0.35} rx={p.headR * 0.18} ry={p.headR * 0.1} fill="#FFAFC0" opacity="0.6" />

      {/* 입 */}
      <path
        d={`M ${60 - p.headR * 0.2} ${p.headCy + p.headR * 0.42} Q 60 ${p.headCy + p.headR * 0.58} ${60 + p.headR * 0.2} ${p.headCy + p.headR * 0.42}`}
        stroke="#3A3633"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      <AccessoryLayer stageIndex={stageIndex} rarity={rarity} p={p} dark={dark} />
    </svg>
  );
}
