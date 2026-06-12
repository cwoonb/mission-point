const STORAGE_PREFIX = 'village-effects-seen';

interface SeenState {
  point: number;
  level: number;
}

function readSeen(userId: string): SeenState | null {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    return raw ? (JSON.parse(raw) as SeenState) : null;
  } catch {
    return null;
  }
}

function writeSeen(userId: string, state: SeenState) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}:${userId}`, JSON.stringify(state));
  } catch {
    // 저장 실패 시 이펙트 트리거만 생략, 기능에는 영향 없음
  }
}

export interface VillageEffectDiff {
  missionComplete: boolean;
  levelUp: boolean;
  itemPlaced: boolean;
}

const ITEM_PLACED_KEY = 'village-effects-item-placed';

/** 마을 꾸미기 페이지에서 아이템을 배치했음을 표시한다 (다음 마을 씬 진입 시 배치 이펙트 재생) */
export function markItemPlaced(userId: string) {
  try {
    sessionStorage.setItem(`${ITEM_PLACED_KEY}:${userId}`, '1');
  } catch {
    // 저장 실패 시 이펙트만 생략
  }
}

/** 마을 씬 진입 시 이전 방문 이후의 포인트/레벨/아이템 배치 변화를 감지해 재생할 이펙트를 판단한다 */
export function consumeVillageEffects(userId: string, point: number, level: number): VillageEffectDiff {
  const prev = readSeen(userId);
  writeSeen(userId, { point, level });

  let itemPlaced = false;
  try {
    const key = `${ITEM_PLACED_KEY}:${userId}`;
    itemPlaced = sessionStorage.getItem(key) === '1';
    sessionStorage.removeItem(key);
  } catch {
    // 무시
  }

  if (!prev) return { missionComplete: false, levelUp: false, itemPlaced };
  return {
    missionComplete: point > prev.point,
    levelUp: level > prev.level,
    itemPlaced,
  };
}
