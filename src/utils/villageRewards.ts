import type {
  Achievement,
  CharacterCosmetic,
  DecorationItem,
  Mission,
  MissionType,
  ItemRarity,
  UserAchievement,
  Village,
  VillageSlotType,
  VillageZone,
} from '../types';
import { getStreak } from './studentStats';

/** 미션 보상 포인트를 마을 경험치로 환산 */
export function expForMission(rewardPoint: number): number {
  return Math.max(10, Math.round(rewardPoint * 0.5));
}

/** 특정 레벨에서 다음 레벨로 가기 위해 필요한 경험치 총량 */
export function levelThreshold(level: number): number {
  return level * 100;
}

export interface ExpResult {
  level: number;
  exp: number;
  leveledUp: boolean;
  oldLevel: number;
  levelsGained: number;
}

/** 마을에 경험치를 더하고 레벨업 여부를 계산 */
export function applyExp(village: Pick<Village, 'level' | 'exp'>, gainedExp: number): ExpResult {
  let level = village.level;
  let exp = village.exp + gainedExp;
  const oldLevel = level;

  while (exp >= levelThreshold(level)) {
    exp -= levelThreshold(level);
    level += 1;
  }

  return {
    level,
    exp,
    leveledUp: level > oldLevel,
    oldLevel,
    levelsGained: level - oldLevel,
  };
}

const ITEM_DROP_CHANCE = 0.35;

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  COMMON: 60,
  RARE: 30,
  EPIC: 9,
  LEGENDARY: 1,
};

function pickWeighted<T extends { rarity: ItemRarity }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + RARITY_WEIGHTS[item.rarity], 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= RARITY_WEIGHTS[item.rarity];
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * 미션 승인 시 일정 확률로 미션 유형에 맞는 장식 아이템을 보상으로 지급한다.
 * 아직 보유하지 않았고, 마을 레벨 + 1 이하로 해금 가능한 아이템 중에서 선택한다.
 */
export function rollItemDrop(
  missionType: MissionType | undefined,
  villageLevel: number,
  items: DecorationItem[],
  ownedItemIds: Set<string>
): DecorationItem | null {
  if (Math.random() > ITEM_DROP_CHANCE) return null;

  const maxLevel = villageLevel + 1;
  const matched = items.filter(
    (item) =>
      item.enabled &&
      item.unlockMissionType === missionType &&
      item.requiredLevel <= maxLevel &&
      !ownedItemIds.has(item.id)
  );

  const pool = matched.length > 0
    ? matched
    : items.filter(
        (item) =>
          item.enabled &&
          !item.unlockMissionType &&
          item.category !== 'THEME' &&
          item.requiredLevel <= maxLevel &&
          !ownedItemIds.has(item.id)
      );

  if (pool.length === 0) return null;
  return pickWeighted(pool);
}

/**
 * 새로 달성한 업적 목록을 반환한다 (아직 user_achievements에 없는 것만).
 */
export function checkNewAchievements(
  userId: string,
  missions: Mission[],
  village: Pick<Village, 'level'>,
  achievements: Achievement[],
  unlockedAchievements: UserAchievement[]
): Achievement[] {
  const unlockedIds = new Set(unlockedAchievements.filter((ua) => ua.userId === userId).map((ua) => ua.achievementId));
  const successMissions = missions.filter((m) => m.assigneeId === userId && m.status === 'SUCCESS');
  const streak = getStreak(missions, userId);

  return achievements.filter((ach) => {
    if (unlockedIds.has(ach.id)) return false;

    switch (ach.conditionType) {
      case 'MISSION_COUNT':
        return successMissions.length >= ach.conditionValue;
      case 'MISSION_TYPE_COUNT':
        return (
          successMissions.filter((m) => m.missionType === ach.conditionMissionType).length >=
          ach.conditionValue
        );
      case 'STREAK':
        return streak >= ach.conditionValue;
      case 'VILLAGE_LEVEL':
        return village.level >= ach.conditionValue;
      default:
        return false;
    }
  });
}

export const VILLAGE_SLOT_LABELS: Record<string, string> = {
  HOUSE: '집',
  INTERIOR: '실내 가구',
  YARD: '앞마당',
  GARDEN: '정원',
  PATH: '길 / 울타리',
  SCHOOL: '학교 / 도서관',
  RESIDENT: '동물 주민',
  BED: '침대',
  DESK: '책상',
  BOOKSHELF: '책장',
  RUG: '러그',
  WINDOW: '창문',
};

export const DECORATION_CATEGORY_LABELS: Record<string, string> = {
  HOUSE: '집',
  FURNITURE: '가구',
  TREE: '나무',
  FLOWER: '꽃',
  ROAD: '길',
  FENCE: '울타리',
  SCHOOL: '학교/도서관',
  STUDY_TOOL: '학습 도구',
  PET: '펫',
  COSTUME: '의상',
  THEME: '테마',
};

export const RARITY_LABELS: Record<ItemRarity, string> = {
  COMMON: '일반',
  RARE: '희귀',
  EPIC: '에픽',
  LEGENDARY: '전설',
};

export const COSMETIC_SLOT_LABELS: Record<string, string> = {
  HAT: '모자',
  GLASSES: '안경',
  TOP: '상의',
  BOTTOM: '하의',
  SHOES: '신발',
  SOCKS: '양말',
  GLOVES: '장갑',
  BAG: '책가방',
};

/** 슬롯이 어느 화면(구역)에 표시되는지 매핑 */
export function getZoneForSlot(slot: VillageSlotType): VillageZone {
  switch (slot) {
    case 'HOUSE':
      return 'HOUSE_EXTERIOR';
    case 'INTERIOR':
    case 'BED':
    case 'DESK':
    case 'BOOKSHELF':
    case 'RUG':
    case 'WINDOW':
      return 'HOUSE_INTERIOR';
    default:
      return 'VILLAGE';
  }
}

const COSMETIC_DROP_CHANCE = 0.2;

/**
 * 미션 승인 시 일정 확률로 미션 유형에 맞는 코스튬 아이템을 보상으로 지급한다.
 */
export function rollCosmeticDrop(
  missionType: MissionType | undefined,
  villageLevel: number,
  cosmetics: CharacterCosmetic[],
  ownedCosmeticIds: Set<string>
): CharacterCosmetic | null {
  if (Math.random() > COSMETIC_DROP_CHANCE) return null;

  const maxLevel = villageLevel + 1;
  const matched = cosmetics.filter(
    (c) =>
      c.enabled &&
      c.unlockMissionType === missionType &&
      c.requiredLevel <= maxLevel &&
      !ownedCosmeticIds.has(c.id)
  );

  if (matched.length === 0) return null;
  return pickWeighted(matched);
}
