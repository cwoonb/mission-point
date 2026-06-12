import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AcquireSource,
  Achievement,
  DecorationItem,
  InventoryItem,
  UserAchievement,
  UserResident,
  VillageResident,
} from '../types';
import {
  initialAchievements,
  initialDecorationItems,
  initialInventoryItems,
  initialUserAchievements,
  initialUserResidents,
  initialVillageResidents,
} from '../data/mockData';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface DecorationState {
  items: DecorationItem[];
  residents: VillageResident[];
  achievements: Achievement[];
  inventory: InventoryItem[];
  userResidents: UserResident[];
  userAchievements: UserAchievement[];

  initializeData: () => void;

  getItem: (itemId: string) => DecorationItem | undefined;
  getResident: (residentId: string) => VillageResident | undefined;
  getAchievement: (achievementId: string) => Achievement | undefined;

  getInventory: (userId: string) => InventoryItem[];
  ownsItem: (userId: string, itemId: string) => boolean;
  addInventoryItem: (userId: string, itemId: string, acquiredVia: AcquireSource) => void;
  purchaseItem: (userId: string, itemId: string) => { success: boolean; message: string };

  getUserResidents: (userId: string) => VillageResident[];
  ownsResident: (userId: string, residentId: string) => boolean;
  unlockResident: (userId: string, residentId: string, acquiredVia: AcquireSource) => boolean;

  getUserAchievements: (userId: string) => UserAchievement[];
  hasAchievement: (userId: string, achievementId: string) => boolean;
  unlockAchievement: (userId: string, achievementId: string) => void;
}

export const useDecorationStore = create<DecorationState>()(
  persist(
    (set, get) => ({
      items: [],
      residents: [],
      achievements: [],
      inventory: [],
      userResidents: [],
      userAchievements: [],

      initializeData: () => {
        if (get().items.length === 0) {
          set({ items: initialDecorationItems });
        }
        if (get().residents.length === 0) {
          set({ residents: initialVillageResidents });
        }
        if (get().achievements.length === 0) {
          set({ achievements: initialAchievements });
        }
        if (get().inventory.length === 0) {
          set({ inventory: initialInventoryItems });
        }
        if (get().userResidents.length === 0) {
          set({ userResidents: initialUserResidents });
        }
        if (get().userAchievements.length === 0) {
          set({ userAchievements: initialUserAchievements });
        }
      },

      getItem: (itemId) => get().items.find((i) => i.id === itemId),
      getResident: (residentId) => get().residents.find((r) => r.id === residentId),
      getAchievement: (achievementId) => get().achievements.find((a) => a.id === achievementId),

      getInventory: (userId) => get().inventory.filter((inv) => inv.userId === userId),

      ownsItem: (userId, itemId) =>
        get().inventory.some((inv) => inv.userId === userId && inv.itemId === itemId),

      addInventoryItem: (userId, itemId, acquiredVia) => {
        set((s) => {
          const existing = s.inventory.find((inv) => inv.userId === userId && inv.itemId === itemId);
          if (existing) {
            return {
              inventory: s.inventory.map((inv) =>
                inv.id === existing.id ? { ...inv, quantity: inv.quantity + 1 } : inv
              ),
            };
          }
          const newItem: InventoryItem = {
            id: genId(),
            userId,
            itemId,
            quantity: 1,
            acquiredVia,
            acquiredAt: new Date().toISOString(),
          };
          return { inventory: [...s.inventory, newItem] };
        });
      },

      purchaseItem: (userId, itemId) => {
        const item = get().getItem(itemId);
        if (!item) return { success: false, message: '아이템을 찾을 수 없습니다.' };
        if (!item.enabled) return { success: false, message: '구매할 수 없는 아이템입니다.' };
        if (get().ownsItem(userId, itemId)) {
          return { success: false, message: '이미 보유한 아이템입니다.' };
        }
        get().addInventoryItem(userId, itemId, 'PURCHASE');
        return { success: true, message: '구매 완료! 🎉' };
      },

      getUserResidents: (userId) => {
        const residentIds = get()
          .userResidents.filter((ur) => ur.userId === userId)
          .map((ur) => ur.residentId);
        return get().residents.filter((r) => residentIds.includes(r.id));
      },

      ownsResident: (userId, residentId) =>
        get().userResidents.some((ur) => ur.userId === userId && ur.residentId === residentId),

      unlockResident: (userId, residentId, acquiredVia) => {
        if (get().ownsResident(userId, residentId)) return false;
        const newResident: UserResident = {
          id: genId(),
          userId,
          residentId,
          acquiredVia,
          acquiredAt: new Date().toISOString(),
        };
        set((s) => ({ userResidents: [...s.userResidents, newResident] }));
        return true;
      },

      getUserAchievements: (userId) => get().userAchievements.filter((ua) => ua.userId === userId),

      hasAchievement: (userId, achievementId) =>
        get().userAchievements.some((ua) => ua.userId === userId && ua.achievementId === achievementId),

      unlockAchievement: (userId, achievementId) => {
        if (get().hasAchievement(userId, achievementId)) return;
        const newAchievement: UserAchievement = {
          id: genId(),
          userId,
          achievementId,
          unlockedAt: new Date().toISOString(),
        };
        set((s) => ({ userAchievements: [...s.userAchievements, newAchievement] }));
      },
    }),
    { name: 'mp-decoration' }
  )
);
