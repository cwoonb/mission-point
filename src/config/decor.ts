/** 개인 공간 꾸미기 아이템 카탈로그 (자체 카탈로그 + 포인트 구매) */

export type DecorCategory = 'FURNITURE' | 'PLANT' | 'FENCE' | 'DECOR' | 'FLOOR';

export interface DecorItem {
  id: string;
  name: string;
  emoji: string;
  category: DecorCategory;
  /** 구매 포인트 */
  price: number;
  /** HomeScene 텍스처 키 */
  tex: string;
  /** 월드 기준 크기(px) — 선택/충돌/렌더 스케일 기준 */
  w: number;
  h: number;
  /** 가구 상호작용: 의자/벤치=앉기, 침대=눕기 */
  sit?: 'sit' | 'lie';
  /** 바닥에 깔리는 아이템(러그/타일)은 캐릭터 아래(깊이 낮게) 렌더 */
  flat?: boolean;
}

export const DECOR_CATEGORY_LABEL: Record<DecorCategory, string> = {
  FURNITURE: '가구',
  PLANT: '식물',
  FENCE: '울타리/문',
  DECOR: '장식',
  FLOOR: '바닥',
};

export const DECOR_ITEMS: DecorItem[] = [
  // ── 가구 ──
  { id: 'chair', name: '나무 의자', emoji: '🪑', category: 'FURNITURE', price: 120, tex: 'decor-chair', w: 26, h: 34, sit: 'sit' },
  { id: 'bench', name: '정원 벤치', emoji: '🛋️', category: 'FURNITURE', price: 220, tex: 'decor-bench', w: 52, h: 30, sit: 'sit' },
  { id: 'bed', name: '포근한 침대', emoji: '🛏️', category: 'FURNITURE', price: 400, tex: 'decor-bed', w: 56, h: 40, sit: 'lie' },
  { id: 'table', name: '원형 테이블', emoji: '🪵', category: 'FURNITURE', price: 180, tex: 'decor-table', w: 38, h: 34 },
  { id: 'rug', name: '체크 러그', emoji: '🟫', category: 'FLOOR', price: 90, tex: 'decor-rug', w: 56, h: 40, flat: true },
  { id: 'lamp', name: '정원 가로등', emoji: '🏮', category: 'DECOR', price: 160, tex: 'decor-lamp', w: 22, h: 48 },

  // ── 식물 ──
  { id: 'tree', name: '작은 나무', emoji: '🌳', category: 'PLANT', price: 200, tex: 'decor-tree', w: 52, h: 64 },
  { id: 'bush', name: '둥근 덤불', emoji: '🌿', category: 'PLANT', price: 70, tex: 'decor-bush', w: 34, h: 28 },
  { id: 'flowerbed', name: '꽃밭', emoji: '🌷', category: 'PLANT', price: 110, tex: 'decor-flowerbed', w: 44, h: 26 },
  { id: 'sunflower', name: '해바라기', emoji: '🌻', category: 'PLANT', price: 80, tex: 'decor-sunflower', w: 22, h: 40 },
  { id: 'pot', name: '화분', emoji: '🪴', category: 'PLANT', price: 60, tex: 'decor-pot', w: 22, h: 30 },

  // ── 울타리/문 ──
  { id: 'fence', name: '나무 울타리', emoji: '🚧', category: 'FENCE', price: 50, tex: 'decor-fence', w: 36, h: 28 },
  { id: 'gate', name: '아치 문', emoji: '⛩️', category: 'FENCE', price: 140, tex: 'decor-gate', w: 40, h: 46 },

  // ── 장식 ──
  { id: 'fountain', name: '작은 분수', emoji: '⛲', category: 'DECOR', price: 320, tex: 'decor-fountain', w: 42, h: 40 },
  { id: 'parasol', name: '파라솔', emoji: '⛱️', category: 'DECOR', price: 240, tex: 'decor-parasol', w: 48, h: 50 },
  { id: 'mailbox', name: '우체통', emoji: '📫', category: 'DECOR', price: 90, tex: 'decor-mailbox', w: 22, h: 36 },
  { id: 'sign', name: '이름표 팻말', emoji: '🪧', category: 'DECOR', price: 70, tex: 'decor-sign', w: 28, h: 30 },
  { id: 'lantern', name: '돌 석등', emoji: '🪔', category: 'DECOR', price: 130, tex: 'decor-lantern', w: 22, h: 38 },
];

export const DECOR_BY_ID: Record<string, DecorItem> = Object.fromEntries(DECOR_ITEMS.map((d) => [d.id, d]));
