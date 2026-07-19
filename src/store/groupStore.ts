import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PerformerGroup } from '../types';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface GroupState {
  groups: PerformerGroup[];
  demoMode: boolean;
  initializeData: () => void;
  createGroup: (params: { name: string; emoji: string; facilitatorId: string }) => PerformerGroup;
  deleteGroup: (groupId: string) => void;
  renameGroup: (groupId: string, name: string, emoji: string) => void;
  getMyGroups: (facilitatorId: string) => PerformerGroup[];
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      demoMode: false,

      initializeData: () => {
        if (get().demoMode) return;
      },

      createGroup: ({ name, emoji, facilitatorId }) => {
        const group: PerformerGroup = {
          id: genId(),
          name,
          emoji,
          facilitatorId,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ groups: [...s.groups, group] }));
        return group;
      },

      deleteGroup: (groupId) => {
        set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
      },

      renameGroup: (groupId, name, emoji) => {
        set((s) => ({
          groups: s.groups.map((g) => g.id === groupId ? { ...g, name, emoji } : g),
        }));
      },

      getMyGroups: (facilitatorId) => {
        return get().groups.filter((g) => g.facilitatorId === facilitatorId);
      },
    }),
    { name: 'mp-groups' }
  )
);
