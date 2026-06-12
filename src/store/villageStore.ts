import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Achievement,
  CharacterCosmetic,
  DecorationItem,
  Mission,
  Village,
  VillagePlacement,
  VillageResident,
  VillageSlotType,
  VillageZone,
} from '../types';
import { initialVillagePlacements, initialVillages } from '../data/mockData';
import { useDecorationStore } from './decorationStore';
import { useCharacterStore } from './characterStore';
import { applyExp, checkNewAchievements, expForMission, getZoneForSlot, rollCosmeticDrop, rollItemDrop } from '../utils/villageRewards';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

export interface AchievementUnlock {
  achievement: Achievement;
  item?: DecorationItem;
  resident?: VillageResident;
}

export interface MissionRewardSummary {
  village: Village;
  expGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  itemGained?: DecorationItem;
  cosmeticGained?: CharacterCosmetic;
  achievementsUnlocked: AchievementUnlock[];
}

interface VillageState {
  villages: Village[];
  placements: VillagePlacement[];

  initializeData: () => void;

  getVillage: (userId: string) => Village | undefined;
  ensureVillage: (userId: string, userName: string) => Village;
  setVillageName: (userId: string, name: string) => void;
  setTheme: (userId: string, themeItemId: string) => void;

  getPlacements: (userId: string) => VillagePlacement[];
  getPlacementsByZone: (userId: string, zone: VillageZone) => VillagePlacement[];
  getPlacement: (userId: string, slot: VillageSlotType) => VillagePlacement | undefined;
  placeItem: (userId: string, slot: VillageSlotType, itemId: string) => void;
  removePlacement: (userId: string, slot: VillageSlotType) => void;

  grantMissionReward: (userId: string, mission: Mission, allMissions: Mission[]) => MissionRewardSummary;
}

export const useVillageStore = create<VillageState>()(
  persist(
    (set, get) => ({
      villages: [],
      placements: [],

      initializeData: () => {
        if (get().villages.length === 0) {
          set({ villages: initialVillages });
        }
        if (get().placements.length === 0) {
          set({ placements: initialVillagePlacements });
        }
      },

      getVillage: (userId) => get().villages.find((v) => v.ownerId === userId),

      ensureVillage: (userId, userName) => {
        const existing = get().getVillage(userId);
        if (existing) return existing;

        const village: Village = {
          id: genId(),
          ownerId: userId,
          name: `${userName}의 마을`,
          level: 1,
          exp: 0,
          theme: 'default',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ villages: [...s.villages, village] }));

        // 새 마을에는 기본 집을 자동으로 배치해준다.
        const placement: VillagePlacement = {
          id: genId(),
          villageId: village.id,
          zone: getZoneForSlot('HOUSE'),
          slot: 'HOUSE',
          itemId: 'deco-house-basic',
          placedAt: new Date().toISOString(),
        };
        set((s) => ({ placements: [...s.placements, placement] }));
        useDecorationStore.getState().addInventoryItem(userId, 'deco-house-basic', 'STARTER');

        return village;
      },

      setVillageName: (userId, name) => {
        set((s) => ({
          villages: s.villages.map((v) => (v.ownerId === userId ? { ...v, name, updatedAt: new Date().toISOString() } : v)),
        }));
      },

      setTheme: (userId, themeItemId) => {
        set((s) => ({
          villages: s.villages.map((v) =>
            v.ownerId === userId ? { ...v, theme: themeItemId, updatedAt: new Date().toISOString() } : v
          ),
        }));
      },

      getPlacements: (userId) => {
        const village = get().getVillage(userId);
        if (!village) return [];
        return get().placements.filter((p) => p.villageId === village.id);
      },

      getPlacementsByZone: (userId, zone) => get().getPlacements(userId).filter((p) => p.zone === zone),

      getPlacement: (userId, slot) => get().getPlacements(userId).find((p) => p.slot === slot),

      placeItem: (userId, slot, itemId) => {
        const village = get().getVillage(userId);
        if (!village) return;

        set((s) => {
          const without = s.placements.filter((p) => !(p.villageId === village.id && p.slot === slot));
          const placement: VillagePlacement = {
            id: genId(),
            villageId: village.id,
            zone: getZoneForSlot(slot),
            slot,
            itemId,
            placedAt: new Date().toISOString(),
          };
          return { placements: [...without, placement] };
        });
      },

      removePlacement: (userId, slot) => {
        const village = get().getVillage(userId);
        if (!village) return;
        set((s) => ({
          placements: s.placements.filter((p) => !(p.villageId === village.id && p.slot === slot)),
        }));
      },

      grantMissionReward: (userId, mission, allMissions) => {
        const decoStore = useDecorationStore.getState();
        const village = get().getVillage(userId) ?? get().ensureVillage(userId, '나');

        const expGained = expForMission(mission.rewardPoint);
        const result = applyExp(village, expGained);

        const updatedVillage: Village = {
          ...village,
          level: result.level,
          exp: result.exp,
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({
          villages: s.villages.map((v) => (v.id === village.id ? updatedVillage : v)),
        }));

        const ownedItemIds = new Set(decoStore.getInventory(userId).map((inv) => inv.itemId));
        const itemGained = rollItemDrop(mission.missionType, result.level, decoStore.items, ownedItemIds);
        if (itemGained) {
          decoStore.addInventoryItem(userId, itemGained.id, 'MISSION_REWARD');
        }

        const charStore = useCharacterStore.getState();
        const ownedCosmeticIds = new Set(charStore.getUserCosmetics(userId).map((uc) => uc.cosmeticId));
        const cosmeticGained = rollCosmeticDrop(mission.missionType, result.level, charStore.cosmetics, ownedCosmeticIds);
        if (cosmeticGained) {
          charStore.addUserCosmetic(userId, cosmeticGained.id, 'MISSION_REWARD');
        }

        const newAchievements = checkNewAchievements(
          userId,
          allMissions,
          updatedVillage,
          decoStore.achievements,
          decoStore.userAchievements
        );

        const achievementsUnlocked: AchievementUnlock[] = newAchievements.map((achievement) => {
          decoStore.unlockAchievement(userId, achievement.id);

          let item: DecorationItem | undefined;
          if (achievement.rewardItemId) {
            decoStore.addInventoryItem(userId, achievement.rewardItemId, 'ACHIEVEMENT');
            item = decoStore.getItem(achievement.rewardItemId);
          }

          let resident: VillageResident | undefined;
          if (achievement.rewardResidentId) {
            const granted = decoStore.unlockResident(userId, achievement.rewardResidentId, 'ACHIEVEMENT');
            if (granted) {
              resident = decoStore.getResident(achievement.rewardResidentId);
            }
          }

          return { achievement, item, resident };
        });

        return {
          village: updatedVillage,
          expGained,
          leveledUp: result.leveledUp,
          oldLevel: result.oldLevel,
          newLevel: result.level,
          itemGained: itemGained ?? undefined,
          cosmeticGained: cosmeticGained ?? undefined,
          achievementsUnlocked,
        };
      },
    }),
    { name: 'mp-village' }
  )
);
