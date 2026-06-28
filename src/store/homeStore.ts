import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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

// ── Supabase <-> App 모델 변환 ──────────────────────────────
interface PlacementRow {
  id: string;
  owner_id: string;
  area: string;
  item_id: string;
  x: number;
  y: number;
  rotation: number;
  flip_x: boolean;
  created_at?: string;
}

const rowToPlacement = (r: PlacementRow): Placement => ({
  id: r.id,
  ownerId: r.owner_id,
  area: (r.area as DecorArea) ?? 'YARD',
  itemId: r.item_id,
  x: r.x,
  y: r.y,
  rotation: r.rotation,
  flipX: r.flip_x,
});

const placementToRow = (p: Placement) => ({
  id: p.id,
  owner_id: p.ownerId,
  area: p.area,
  item_id: p.itemId,
  x: p.x,
  y: p.y,
  rotation: p.rotation,
  flip_x: p.flipX,
});

const pushInsert = (p: Placement) => {
  supabase.from('home_placements').insert(placementToRow(p)).then(({ error }) => {
    if (error) console.error('home placement insert failed:', error.message);
  });
};
const pushUpdate = (id: string, patch: Record<string, unknown>) => {
  supabase.from('home_placements').update(patch).eq('id', id).then(({ error }) => {
    if (error) console.error('home placement update failed:', error.message);
  });
};
const pushDelete = (id: string) => {
  supabase.from('home_placements').delete().eq('id', id).then(({ error }) => {
    if (error) console.error('home placement delete failed:', error.message);
  });
};

interface HomeState {
  placements: Placement[];
  /** 구매했지만 아직 배치하지 않은 보유 수량 — ownerId → itemId → count (로컬 전용) */
  inventory: Record<string, Record<string, number>>;

  /** Supabase에서 배치를 로드(소스 오브 트루스). 원격이 비고 로컬이 있으면 1회 클라우드로 마이그레이션 */
  loadPlacements: (ownerId: string) => Promise<void>;
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
 * Supabase `home_placements`가 소스 오브 트루스, zustand persist(localStorage 'mp-home')는 오프라인 캐시.
 * → 재접속/기기 변경해도 배치 유지.
 */
export const useHomeStore = create<HomeState>()(
  persist(
    (set, get) => ({
      placements: [],
      inventory: {},

      loadPlacements: async (ownerId) => {
        const { data, error } = await supabase.from('home_placements').select('*').eq('owner_id', ownerId);
        if (error) {
          console.error('Failed to load home placements:', error.message);
          return; // 오프라인/실패 시 로컬 캐시 유지
        }
        const remote = (data as PlacementRow[] | null ?? []).map(rowToPlacement);
        const localOwn = get().placements.filter((p) => p.ownerId === ownerId);
        if (remote.length === 0 && localOwn.length > 0) {
          // 기존 localStorage 배치를 클라우드로 1회 마이그레이션 (로컬 유지)
          localOwn.forEach(pushInsert);
          return;
        }
        set((s) => ({ placements: [...s.placements.filter((p) => p.ownerId !== ownerId), ...remote] }));
      },

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
        pushInsert(placement);
        return id;
      },

      movePlacement: (id, x, y) => {
        const nx = Math.max(0, Math.min(1, x));
        const ny = Math.max(0, Math.min(1, y));
        set((s) => ({ placements: s.placements.map((p) => (p.id === id ? { ...p, x: nx, y: ny } : p)) }));
        pushUpdate(id, { x: nx, y: ny });
      },

      rotatePlacement: (id) => {
        let next = 0;
        set((s) => ({
          placements: s.placements.map((p) => {
            if (p.id !== id) return p;
            next = (p.rotation + 90) % 360;
            return { ...p, rotation: next };
          }),
        }));
        pushUpdate(id, { rotation: next });
      },

      flipPlacement: (id) => {
        let next = false;
        set((s) => ({
          placements: s.placements.map((p) => {
            if (p.id !== id) return p;
            next = !p.flipX;
            return { ...p, flipX: next };
          }),
        }));
        pushUpdate(id, { flip_x: next });
      },

      removePlacement: (id) => {
        set((s) => {
          const p = s.placements.find((x) => x.id === id);
          const inventory = p ? addInv(s.inventory, p.ownerId, p.itemId, +1) : s.inventory;
          return { placements: s.placements.filter((x) => x.id !== id), inventory };
        });
        pushDelete(id);
      },

      getPlacements: (ownerId, area = 'YARD') => get().placements.filter((p) => p.ownerId === ownerId && p.area === area),
      getInventory: (ownerId) => get().inventory[ownerId] ?? {},
      getOwnedCount: (ownerId, itemId) => get().inventory[ownerId]?.[itemId] ?? 0,
    }),
    { name: 'mp-home' }
  )
);
