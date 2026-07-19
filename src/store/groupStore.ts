import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PerformerGroup } from '../types';
import { supabase } from '../lib/supabase';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface GroupState {
  groups: PerformerGroup[];
  demoMode: boolean;
  initializeData: () => Promise<void>;
  createGroup: (params: { name: string; emoji: string; facilitatorId: string; organizationId?: string }) => Promise<PerformerGroup>;
  deleteGroup: (groupId: string) => Promise<void>;
  renameGroup: (groupId: string, name: string, emoji: string) => Promise<void>;
  getMyGroups: (facilitatorId: string) => PerformerGroup[];
}

export const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      groups: [],
      demoMode: false,

      initializeData: async () => {
        if (get().demoMode) return;
        const { data, error } = await supabase.from('performer_groups').select('*');
        if (error) return;
        if (get().demoMode) return;
        set({ groups: (data ?? []).map((row) => ({
          id: row.id,
          organizationId: row.organization_id ?? undefined,
          name: row.name,
          emoji: row.emoji,
          facilitatorId: row.facilitator_id,
          createdAt: row.created_at,
        })) });
      },

      createGroup: async ({ name, emoji, facilitatorId, organizationId }) => {
        if (!get().demoMode && !organizationId) throw new Error('소속을 선택해 주세요.');
        const group: PerformerGroup = {
          id: genId(),
          organizationId,
          name,
          emoji,
          facilitatorId,
          createdAt: new Date().toISOString(),
        };
        if (!get().demoMode) {
          const { error } = await supabase.from('performer_groups').insert({ id: group.id, organization_id: organizationId, name: group.name, emoji: group.emoji, facilitator_id: group.facilitatorId, created_at: group.createdAt });
          if (error) throw new Error(error.message);
        }
        set((s) => ({ groups: [...s.groups, group] }));
        return group;
      },

      deleteGroup: async (groupId) => {
        if (!get().demoMode) {
          const { error } = await supabase.from('performer_groups').delete().eq('id', groupId);
          if (error) throw new Error(error.message);
        }
        set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
      },

      renameGroup: async (groupId, name, emoji) => {
        if (!get().demoMode) {
          const { error } = await supabase.from('performer_groups').update({ name, emoji }).eq('id', groupId);
          if (error) throw new Error(error.message);
        }
        set((s) => ({
          groups: s.groups.map((g) => g.id === groupId ? { ...g, name, emoji } : g),
        }));
      },

      getMyGroups: (facilitatorId) => {
        return get().groups.filter((g) => g.facilitatorId === facilitatorId);
      },
    }),
    {
      name: 'mp-groups',
      partialize: (state) => ({
        groups: state.groups.filter((item) => item.id.startsWith('demo-')),
        demoMode: state.demoMode,
      }),
    }
  )
);
