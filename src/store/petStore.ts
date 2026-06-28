import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Egg, EggType, Pet, PetRarity, PetSpecies } from '../types';
import { initialEggs, initialPets } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { usePointStore } from './pointStore';
import {
  ALL_SPECIES,
  EGG_COST,
  FEED_COST,
  FEED_EXP_GAIN,
  FEED_HAPPINESS_GAIN,
  HAPPINESS_DAILY_DECAY,
  HAPPINESS_DEFAULT,
  HAPPINESS_FLOOR,
  HAPPINESS_MAX,
  MISSION_EXP_GAIN,
  MISSION_HAPPINESS_GAIN,
  rollRarity,
  rollSpecies,
  SPECIES_RARITY,
  stageIndexFromExp,
} from '../config/pets';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Supabase <-> App 모델 변환 ──────────────────────────────
interface PetRow {
  id: string;
  owner_id: string;
  species: PetSpecies;
  rarity: PetRarity;
  name: string;
  stage_index: number;
  exp: number;
  total_exp: number;
  happiness: number;
  hatched: boolean;
  is_active: boolean;
  last_interacted_at: string;
  created_at: string;
}

interface EggRow {
  id: string;
  owner_id: string;
  type: EggType;
  created_at: string;
}

const rowToPet = (r: PetRow): Pet => ({
  id: r.id,
  ownerId: r.owner_id,
  species: r.species,
  rarity: r.rarity,
  name: r.name,
  stageIndex: r.stage_index,
  exp: r.exp,
  totalExp: r.total_exp,
  happiness: r.happiness,
  hatched: r.hatched,
  isActive: r.is_active,
  lastInteractedAt: r.last_interacted_at,
  createdAt: r.created_at,
});

const petToRow = (p: Pet) => ({
  id: p.id,
  owner_id: p.ownerId,
  species: p.species,
  rarity: p.rarity,
  name: p.name,
  stage_index: p.stageIndex,
  exp: p.exp,
  total_exp: p.totalExp,
  happiness: p.happiness,
  hatched: p.hatched,
  is_active: p.isActive,
  last_interacted_at: p.lastInteractedAt,
  created_at: p.createdAt,
});

const rowToEgg = (r: EggRow): Egg => ({
  id: r.id,
  ownerId: r.owner_id,
  type: r.type,
  createdAt: r.created_at,
});

const eggToRow = (e: Egg) => ({
  id: e.id,
  owner_id: e.ownerId,
  type: e.type,
  created_at: e.createdAt,
});

const pushPetInsert = (pet: Pet) => {
  supabase.from('pets').insert(petToRow(pet)).then(({ error }) => {
    if (error) console.error('Supabase pet insert failed:', error.message);
  });
};

const pushPetUpdate = (petId: string, patch: Record<string, unknown>) => {
  supabase.from('pets').update(patch).eq('id', petId).then(({ error }) => {
    if (error) console.error('Supabase pet update failed:', error.message);
  });
};

const pushEggInsert = (egg: Egg) => {
  supabase.from('eggs').insert(eggToRow(egg)).then(({ error }) => {
    if (error) console.error('Supabase egg insert failed:', error.message);
  });
};

const pushEggDelete = (eggId: string) => {
  supabase.from('eggs').delete().eq('id', eggId).then(({ error }) => {
    if (error) console.error('Supabase egg delete failed:', error.message);
  });
};

const clampHappiness = (value: number) => Math.max(0, Math.min(HAPPINESS_MAX, value));

interface DexEntry {
  species: PetSpecies;
  rarity: PetRarity;
  owned: boolean;
}

interface PetState {
  pets: Pet[];
  eggs: Egg[];

  loadPets: (ownerId: string) => Promise<void>;
  buyEgg: (ownerId: string, type: EggType) => { success: boolean; message: string };
  hatchEgg: (eggId: string) => { success: boolean; message: string; pet?: Pet };
  gainExp: (petId: string, amount: number) => void;
  addHappiness: (petId: string, amount: number) => void;
  feed: (petId: string) => { success: boolean; message: string };
  renamePet: (petId: string, name: string) => void;
  setActivePet: (ownerId: string, petId: string) => void;
  applyHappinessDecay: (ownerId: string) => void;
  getPetsByOwner: (ownerId: string) => Pet[];
  getEggsByOwner: (ownerId: string) => Egg[];
  getActivePet: (ownerId: string) => Pet | undefined;
  getDex: (ownerId: string) => DexEntry[];
  /** 미션 승인 직후 호출 — 활성 펫에게 경험치/행복도 보상을 준다 (실패/미제출은 호출하지 않음 → 페널티 없음) */
  onMissionApproved: (ownerId: string) => void;
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pets: [],
      eggs: [],

      loadPets: async (ownerId) => {
        const [petsRes, eggsRes] = await Promise.all([
          supabase.from('pets').select('*').eq('owner_id', ownerId),
          supabase.from('eggs').select('*').eq('owner_id', ownerId),
        ]);

        if (petsRes.error) {
          console.error('Failed to load pets:', petsRes.error.message);
        } else if (petsRes.data && petsRes.data.length > 0) {
          const remote = (petsRes.data as PetRow[]).map(rowToPet);
          set((s) => ({ pets: [...s.pets.filter((p) => p.ownerId !== ownerId), ...remote] }));
        }

        if (eggsRes.error) {
          console.error('Failed to load eggs:', eggsRes.error.message);
        } else if (eggsRes.data && eggsRes.data.length > 0) {
          const remote = (eggsRes.data as EggRow[]).map(rowToEgg);
          set((s) => ({ eggs: [...s.eggs.filter((e) => e.ownerId !== ownerId), ...remote] }));
        }

        const hasPets = get().pets.some((p) => p.ownerId === ownerId);
        const hasEggs = get().eggs.some((e) => e.ownerId === ownerId);
        if (!hasPets && !hasEggs) {
          const petSeeds = initialPets.filter((p) => p.ownerId === ownerId);
          const eggSeeds = initialEggs.filter((e) => e.ownerId === ownerId);
          if (petSeeds.length > 0 || eggSeeds.length > 0) {
            set((s) => ({ pets: [...s.pets, ...petSeeds], eggs: [...s.eggs, ...eggSeeds] }));
            if (!petsRes.error) petSeeds.forEach(pushPetInsert);
            if (!eggsRes.error) eggSeeds.forEach(pushEggInsert);
          } else {
            const starterEgg: Egg = { id: genId(), ownerId, type: 'basic', createdAt: new Date().toISOString() };
            set((s) => ({ eggs: [...s.eggs, starterEgg] }));
            pushEggInsert(starterEgg);
          }
        }

        get().applyHappinessDecay(ownerId);
      },

      buyEgg: (ownerId, type) => {
        const cost = EGG_COST[type];
        const owner = useAuthStore.getState().getUser(ownerId);
        if (!owner || owner.point < cost) {
          return { success: false, message: `포인트가 부족해요! (${cost}P 필요)` };
        }
        useAuthStore.getState().updateUserPoint(ownerId, -cost);
        usePointStore.getState().addTransaction(ownerId, -cost, 'PET_EGG', type === 'premium' ? '프리미엄 알 구매' : '일반 알 구매');

        const egg: Egg = { id: genId(), ownerId, type, createdAt: new Date().toISOString() };
        set((s) => ({ eggs: [...s.eggs, egg] }));
        pushEggInsert(egg);
        return { success: true, message: '새로운 알을 받았어요! 부화시켜 보세요.' };
      },

      hatchEgg: (eggId) => {
        const egg = get().eggs.find((e) => e.id === eggId);
        if (!egg) return { success: false, message: '알을 찾을 수 없어요.' };

        const rarity = rollRarity(egg.type);
        const species = rollSpecies(rarity);
        const hasActive = get().pets.some((p) => p.ownerId === egg.ownerId && p.isActive);

        const pet: Pet = {
          id: genId(),
          ownerId: egg.ownerId,
          species,
          rarity,
          name: '',
          stageIndex: 1,
          exp: 0,
          totalExp: 0,
          happiness: HAPPINESS_DEFAULT,
          hatched: true,
          isActive: !hasActive,
          lastInteractedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

        set((s) => ({
          pets: [...s.pets, pet],
          eggs: s.eggs.filter((e) => e.id !== eggId),
        }));
        pushPetInsert(pet);
        pushEggDelete(eggId);
        return { success: true, message: '알이 부화했어요! 🎉', pet };
      },

      gainExp: (petId, amount) => {
        if (amount <= 0) return;
        set((s) => ({
          pets: s.pets.map((p) => {
            if (p.id !== petId || !p.hatched) return p;
            const totalExp = p.totalExp + amount;
            const stageIndex = stageIndexFromExp(p.rarity, totalExp);
            const updated: Pet = {
              ...p,
              exp: totalExp,
              totalExp,
              stageIndex,
              lastInteractedAt: new Date().toISOString(),
            };
            pushPetUpdate(p.id, {
              exp: updated.exp,
              total_exp: updated.totalExp,
              stage_index: updated.stageIndex,
              last_interacted_at: updated.lastInteractedAt,
            });
            return updated;
          }),
        }));
      },

      addHappiness: (petId, amount) => {
        set((s) => ({
          pets: s.pets.map((p) => {
            if (p.id !== petId) return p;
            const happiness = clampHappiness(p.happiness + amount);
            const lastInteractedAt = new Date().toISOString();
            pushPetUpdate(p.id, { happiness, last_interacted_at: lastInteractedAt });
            return { ...p, happiness, lastInteractedAt };
          }),
        }));
      },

      feed: (petId) => {
        const pet = get().pets.find((p) => p.id === petId);
        if (!pet) return { success: false, message: '펫을 찾을 수 없어요.' };
        const owner = useAuthStore.getState().getUser(pet.ownerId);
        if (!owner || owner.point < FEED_COST) {
          return { success: false, message: `포인트가 부족해요! (${FEED_COST}P 필요)` };
        }
        useAuthStore.getState().updateUserPoint(pet.ownerId, -FEED_COST);
        usePointStore.getState().addTransaction(pet.ownerId, -FEED_COST, 'PET_FEED', `${pet.name || '펫'} 밥 주기`);
        get().addHappiness(petId, FEED_HAPPINESS_GAIN);
        get().gainExp(petId, FEED_EXP_GAIN);
        return { success: true, message: `${pet.name || '펫'}이(가) 맛있게 먹었어요! 행복도 +${FEED_HAPPINESS_GAIN}` };
      },

      renamePet: (petId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({ pets: s.pets.map((p) => (p.id === petId ? { ...p, name: trimmed } : p)) }));
        pushPetUpdate(petId, { name: trimmed });
      },

      setActivePet: (ownerId, petId) => {
        set((s) => ({
          pets: s.pets.map((p) => {
            if (p.ownerId !== ownerId) return p;
            const isActive = p.id === petId;
            if (isActive !== p.isActive) pushPetUpdate(p.id, { is_active: isActive });
            return p.ownerId === ownerId ? { ...p, isActive } : p;
          }),
        }));
      },

      applyHappinessDecay: (ownerId) => {
        const now = Date.now();
        set((s) => ({
          pets: s.pets.map((p) => {
            if (p.ownerId !== ownerId || !p.hatched) return p;
            const last = new Date(p.lastInteractedAt).getTime();
            const days = Math.floor((now - last) / 86400000);
            if (days <= 0) return p;
            const happiness = Math.max(HAPPINESS_FLOOR, p.happiness - days * HAPPINESS_DAILY_DECAY);
            const lastInteractedAt = new Date(now).toISOString();
            if (happiness !== p.happiness) {
              pushPetUpdate(p.id, { happiness, last_interacted_at: lastInteractedAt });
            }
            return { ...p, happiness, lastInteractedAt };
          }),
        }));
      },

      getPetsByOwner: (ownerId) => get().pets.filter((p) => p.ownerId === ownerId),

      getEggsByOwner: (ownerId) => get().eggs.filter((e) => e.ownerId === ownerId),

      getActivePet: (ownerId) => {
        const owned = get().pets.filter((p) => p.ownerId === ownerId);
        return owned.find((p) => p.isActive) ?? owned[0];
      },

      getDex: (ownerId) => {
        const owned = new Set(get().pets.filter((p) => p.ownerId === ownerId).map((p) => p.species));
        return ALL_SPECIES.map((species) => ({
          species,
          rarity: SPECIES_RARITY[species],
          owned: owned.has(species),
        }));
      },

      onMissionApproved: (ownerId) => {
        const active = get().getActivePet(ownerId);
        if (!active) return;
        get().gainExp(active.id, MISSION_EXP_GAIN);
        get().addHappiness(active.id, MISSION_HAPPINESS_GAIN);
      },
    }),
    { name: 'mp-pets' }
  )
);
