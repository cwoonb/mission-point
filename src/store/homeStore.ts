import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 배치 영역 — 현재는 마당(YARD)만, 추후 집 실내(HOUSE) 확장 가능 */
export type DecorArea = 'YARD';

/** 자유 배치된 꾸미기 아이템 한 개. 좌표는 맵 기준 0~1 정규화(해상도 독립) */
export interface Placement {
  id: string;
  ownerId: string;
  area: DecorArea;
  itemId: string;
  x: number; // 0~1 (맵 가로 비율)
  y: number; // 0~1 (맵 세로 비율)
  rotation: number; // 0 | 90 | 180 | 270
  flipX: boolean;
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

interface HomeState {
  placements: Placement[];
  /** 구매했지만 아직 배치하지 않은 보유 수량 — ownerId → itemId → count */
  inventory: Record<string, Record<string, number>>;

  buyToInventory: (ownerId: string, itemId: string) => void;
  placeFromInventory: (ownerId: string, itemId: string, x: number, y: number) => string | null;
  movePlacement: (id: string, x: number, y: number) => void;
  rotatePlacement: (id: string) => void;
  flipPlacement: (id: string) => void;
  /** 배치 제거 → 보유 인벤토리로 환원 */
  removePlacement: (id: string) => void;

  getPlacements: (ownerId: string, area?: DecorArea) => Placement[];
  getInventory: (ownerId: string) => Record<string, number>;
  getOwnedCount: (ownerId: string, itemId: string) => number;
}

const addInv = (inv: HomeState['inventory'], ownerId: string, itemId: string, delta: number) => {
  const owner = { ...(inv[ownerId] ?? {}) };
  owner[itemId] = Math.max(0, (owner[itemId] ?? 0) + delta);
  return { ...inv, [ownerId]: owner };
};

/**
 * 개인 공간(집/마당) 꾸미기 저장소.
 * zustand persist(localStorage 'mp-home')로 영속화 → 재접속해도 배치/보유 유지.
 */
export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      placements: [],
      inventory: {},

      buyToInventory: (ownerId, itemId) => {
        set((s) => ({ inventory: addInv(s.inventory, ownerId, itemId, +1) }));
      },

      placeFromInventory: (ownerId, itemId, x, y) => {
        if (get().getOwnedCount(ownerId, itemId) <= 0) return null;
        const id = genId();
        const placement: Placement = {
          id, ownerId, area: 'YARD', itemId,
          x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)),
          rotation: 0, flipX: false,
        };
        set((s) => ({ placements: [...s.placements, placement], inventory: addInv(s.inventory, ownerId, itemId, -1) }));
        return id;
      },

      movePlacement: (id, x, y) => {
        set((s) => ({
          placements: s.placements.map((p) =>
            p.id === id ? { ...p, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } : p
          ),
        }));
      },

      rotatePlacement: (id) => {
        set((s) => ({ placements: s.placements.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p)) }));
      },

      flipPlacement: (id) => {
        set((s) => ({ placements: s.placements.map((p) => (p.id === id ? { ...p, flipX: !p.flipX } : p)) }));
      },

      removePlacement: (id) => {
        set((s) => {
          const p = s.placements.find((x) => x.id === id);
          const inventory = p ? addInv(s.inventory, p.ownerId, p.itemId, +1) : s.inventory;
          return { placements: s.placements.filter((x) => x.id !== id), inventory };
        });
      },

      getPlacements: (ownerId, area = 'YARD') => get().placements.filter((p) => p.ownerId === ownerId && p.area === area),
      getInventory: (ownerId) => get().inventory[ownerId] ?? {},
      getOwnedCount: (ownerId, itemId) => get().inventory[ownerId]?.[itemId] ?? 0,
    }),
    { name: 'mp-home' }
  )
);
