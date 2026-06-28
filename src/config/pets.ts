import type { EggType, PetRarity, PetSpecies } from '../types';

/** 희귀도 정렬 순서 (낮음 → 높음) */
export const RARITY_ORDER: PetRarity[] = ['common', 'rare', 'magic', 'legendary'];

export const RARITY_LABEL: Record<PetRarity, string> = {
  common: '일반',
  rare: '레어',
  magic: '매직',
  legendary: '레전더리',
};

export const RARITY_EMOJI: Record<PetRarity, string> = {
  common: '⚪',
  rare: '🔵',
  magic: '🟣',
  legendary: '🟡',
};

/** 희귀도별 카드/배지 색상 */
export const RARITY_COLOR: Record<PetRarity, { bg: string; text: string; ring: string; gradient: string; solid: string }> = {
  common: { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-300', gradient: 'from-gray-200 to-slate-300', solid: '#CBD5E1' },
  rare: { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-300', gradient: 'from-sky-300 to-blue-400', solid: '#7DD3FC' },
  magic: { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-300', gradient: 'from-violet-300 via-fuchsia-300 to-purple-400', solid: '#C4B5FD' },
  legendary: { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-300', gradient: 'from-amber-300 via-yellow-300 to-orange-400', solid: '#FCD34D' },
};

/** 희귀도별 등장 가능한 종 목록 (공룡은 항상 rare → common에서 절대 등장하지 않음) */
export const SPECIES_BY_RARITY: Record<PetRarity, PetSpecies[]> = {
  common: ['dog', 'cat', 'rabbit', 'chick'],
  rare: ['dino', 'fox'],
  magic: ['slime', 'unicorn'],
  legendary: ['dragon', 'phoenix'],
};

export const SPECIES_LABEL: Record<PetSpecies, string> = {
  dog: '강아지',
  cat: '고양이',
  rabbit: '토끼',
  chick: '병아리',
  dino: '공룡',
  fox: '여우',
  slime: '슬라임',
  unicorn: '유니콘',
  dragon: '드래곤',
  phoenix: '피닉스',
};

export const SPECIES_EMOJI: Record<PetSpecies, string> = {
  dog: '🐶',
  cat: '🐱',
  rabbit: '🐰',
  chick: '🐤',
  dino: '🦕',
  fox: '🦊',
  slime: '🟢',
  unicorn: '🦄',
  dragon: '🐉',
  phoenix: '🔥',
};

/** 종 → 희귀도 역참조 (SPECIES_BY_RARITY로부터 생성) */
export const SPECIES_RARITY: Record<PetSpecies, PetRarity> = RARITY_ORDER.reduce((acc, rarity) => {
  SPECIES_BY_RARITY[rarity].forEach((species) => {
    acc[species] = rarity;
  });
  return acc;
}, {} as Record<PetSpecies, PetRarity>);

export const ALL_SPECIES: PetSpecies[] = RARITY_ORDER.flatMap((r) => SPECIES_BY_RARITY[r]);

/** 희귀도별 최종 진화 단계 수 (알 제외, 부화 후 형태 수) */
export const MAX_STAGE: Record<PetRarity, number> = {
  common: 3,
  rare: 4,
  magic: 5,
  legendary: 5,
};

/**
 * 희귀도별 진화 누적 경험치 임계값.
 * 배열의 n번째 값은 "stageIndex가 n+2가 되기 위해 필요한 누적 경험치"를 의미한다.
 * 희귀도가 높을수록 다음 단계까지 더 많은 경험치가 필요하다.
 */
export const EVOLUTION_THRESHOLDS: Record<PetRarity, number[]> = {
  common: [5, 15],
  rare: [6, 18, 36],
  magic: [8, 24, 48, 80],
  legendary: [10, 32, 64, 110],
};

/** 누적 경험치로부터 현재 진화 단계(1 ~ MAX_STAGE)를 계산한다 */
export const stageIndexFromExp = (rarity: PetRarity, totalExp: number): number => {
  const thresholds = EVOLUTION_THRESHOLDS[rarity];
  let stage = 1;
  for (const threshold of thresholds) {
    if (totalExp >= threshold) stage += 1;
    else break;
  }
  return Math.min(stage, MAX_STAGE[rarity]);
};

/** 다음 진화까지 필요한 경험치 정보 (최종 단계면 null) */
export const nextEvolutionInfo = (
  rarity: PetRarity,
  stageIndex: number,
  totalExp: number
): { current: number; required: number } | null => {
  if (stageIndex >= MAX_STAGE[rarity]) return null;
  const threshold = EVOLUTION_THRESHOLDS[rarity][stageIndex - 1];
  const prevThreshold = stageIndex > 1 ? EVOLUTION_THRESHOLDS[rarity][stageIndex - 2] : 0;
  return { current: totalExp - prevThreshold, required: threshold - prevThreshold };
};

/** 알 종류별 가격(포인트) */
export const EGG_COST: Record<EggType, number> = {
  basic: 30,
  premium: 100,
};

export const EGG_LABEL: Record<EggType, string> = {
  basic: '일반 알',
  premium: '프리미엄 알',
};

/** 알 종류별 희귀도 등장 확률 (%, 합계 100) */
export const EGG_PROBABILITIES: Record<EggType, Record<PetRarity, number>> = {
  basic: { common: 62, rare: 26, magic: 9, legendary: 3 },
  premium: { common: 30, rare: 42, magic: 20, legendary: 8 },
};

/** 희귀도 확률표를 누적 [0,1] 구간으로 변환해 weighted random에 사용 */
export const rollRarity = (eggType: EggType): PetRarity => {
  const table = EGG_PROBABILITIES[eggType];
  const roll = Math.random() * 100;
  let acc = 0;
  for (const rarity of RARITY_ORDER) {
    acc += table[rarity];
    if (roll < acc) return rarity;
  }
  return 'common';
};

export const rollSpecies = (rarity: PetRarity): PetSpecies => {
  const list = SPECIES_BY_RARITY[rarity];
  return list[Math.floor(Math.random() * list.length)];
};

/** 밥 주기 비용(포인트) / 행복도 회복량 / 약간의 성장 보너스 */
export const FEED_COST = 10;
export const FEED_HAPPINESS_GAIN = 15;
export const FEED_EXP_GAIN = 1;

/** 미션 승인 시 활성 펫이 받는 경험치/행복도 보상 */
export const MISSION_EXP_GAIN = 1;
export const MISSION_HAPPINESS_GAIN = 10;

/** 행복도는 하루에 아주 약하게 감소하고 일정 수준 이하로는 떨어지지 않음 (절대 0이 되거나 "죽지" 않음) */
export const HAPPINESS_DAILY_DECAY = 5;
export const HAPPINESS_FLOOR = 20;
export const HAPPINESS_MAX = 100;
export const HAPPINESS_DEFAULT = 80;
