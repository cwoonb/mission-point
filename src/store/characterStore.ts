import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AcquireSource, CharacterCosmetic, CharacterProfile, CosmeticSlot, UserCosmetic } from '../types';
import { initialCharacterCosmetics, initialCharacterProfiles, initialUserCosmetics } from '../data/mockData';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const STARTER_COSMETICS: Record<'TOP' | 'BOTTOM' | 'SHOES', string> = {
  TOP: 'cos-top-basic',
  BOTTOM: 'cos-bottom-basic',
  SHOES: 'cos-shoes-basic',
};

interface CharacterState {
  profiles: CharacterProfile[];
  cosmetics: CharacterCosmetic[];
  userCosmetics: UserCosmetic[];

  initializeData: () => void;

  getProfile: (userId: string) => CharacterProfile | undefined;
  ensureProfile: (userId: string, userName: string) => CharacterProfile;
  updateProfile: (userId: string, patch: Partial<Omit<CharacterProfile, 'id' | 'userId' | 'createdAt'>>) => void;

  getCosmetic: (cosmeticId: string) => CharacterCosmetic | undefined;
  getUserCosmetics: (userId: string) => UserCosmetic[];
  getOwnedCosmetics: (userId: string) => CharacterCosmetic[];
  ownsCosmetic: (userId: string, cosmeticId: string) => boolean;
  addUserCosmetic: (userId: string, cosmeticId: string, acquiredVia: AcquireSource) => void;
  purchaseCosmetic: (userId: string, cosmeticId: string) => { success: boolean; message: string };
  equipCosmetic: (userId: string, slot: CosmeticSlot, cosmeticId: string) => void;
  unequipCosmetic: (userId: string, slot: CosmeticSlot) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      profiles: [],
      cosmetics: [],
      userCosmetics: [],

      initializeData: () => {
        if (get().cosmetics.length === 0) {
          set({ cosmetics: initialCharacterCosmetics });
        }
        if (get().profiles.length === 0) {
          set({ profiles: initialCharacterProfiles });
        }
        if (get().userCosmetics.length === 0) {
          set({ userCosmetics: initialUserCosmetics });
        }
      },

      getProfile: (userId) => get().profiles.find((p) => p.userId === userId),

      ensureProfile: (userId, userName) => {
        const existing = get().getProfile(userId);
        if (existing) return existing;

        const profile: CharacterProfile = {
          id: genId(),
          userId,
          name: userName,
          gender: 'A',
          skinColor: '#FFD9B3',
          hairStyle: 'short',
          hairColor: '#4A3526',
          eyeShape: 'round',
          equipped: {
            TOP: STARTER_COSMETICS.TOP,
            BOTTOM: STARTER_COSMETICS.BOTTOM,
            SHOES: STARTER_COSMETICS.SHOES,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ profiles: [...s.profiles, profile] }));

        Object.values(STARTER_COSMETICS).forEach((cosmeticId) => {
          get().addUserCosmetic(userId, cosmeticId, 'STARTER');
        });

        return profile;
      },

      updateProfile: (userId, patch) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.userId === userId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
          ),
        }));
      },

      getCosmetic: (cosmeticId) => get().cosmetics.find((c) => c.id === cosmeticId),

      getUserCosmetics: (userId) => get().userCosmetics.filter((uc) => uc.userId === userId),

      getOwnedCosmetics: (userId) => {
        const ids = new Set(get().getUserCosmetics(userId).map((uc) => uc.cosmeticId));
        return get().cosmetics.filter((c) => ids.has(c.id));
      },

      ownsCosmetic: (userId, cosmeticId) =>
        get().userCosmetics.some((uc) => uc.userId === userId && uc.cosmeticId === cosmeticId),

      addUserCosmetic: (userId, cosmeticId, acquiredVia) => {
        if (get().ownsCosmetic(userId, cosmeticId)) return;
        const newUserCosmetic: UserCosmetic = {
          id: genId(),
          userId,
          cosmeticId,
          acquiredVia,
          acquiredAt: new Date().toISOString(),
        };
        set((s) => ({ userCosmetics: [...s.userCosmetics, newUserCosmetic] }));
      },

      purchaseCosmetic: (userId, cosmeticId) => {
        const cosmetic = get().getCosmetic(cosmeticId);
        if (!cosmetic) return { success: false, message: '아이템을 찾을 수 없습니다.' };
        if (!cosmetic.enabled) return { success: false, message: '구매할 수 없는 아이템입니다.' };
        if (get().ownsCosmetic(userId, cosmeticId)) {
          return { success: false, message: '이미 보유한 아이템입니다.' };
        }
        get().addUserCosmetic(userId, cosmeticId, 'PURCHASE');
        return { success: true, message: '구매 완료! 🎉' };
      },

      equipCosmetic: (userId, slot, cosmeticId) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.userId === userId
              ? { ...p, equipped: { ...p.equipped, [slot]: cosmeticId }, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      unequipCosmetic: (userId, slot) => {
        set((s) => ({
          profiles: s.profiles.map((p) => {
            if (p.userId !== userId) return p;
            const equipped = { ...p.equipped };
            delete equipped[slot];
            return { ...p, equipped, updatedAt: new Date().toISOString() };
          }),
        }));
      },
    }),
    { name: 'mp-character' }
  )
);
