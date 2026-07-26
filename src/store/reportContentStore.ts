import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReportTeacherContent } from '../types';
import { secureBackendEnabled, supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useMembershipStore } from './membershipStore';
import { isFacilitatorMembership } from '../utils/membershipAccess';

const keyFor = (organizationId: string, studentId: string) => `${organizationId}::${studentId}`;

interface ReportContentState {
  contents: Record<string, ReportTeacherContent>;
  loadedKeys: string[];
  load: (organizationId: string, studentId: string) => Promise<void>;
  saveMemo: (organizationId: string, studentId: string, memo: string) => Promise<void>;
  getMemo: (organizationId?: string, studentId?: string) => string;
  seedDemoMemos: (organizationId: string, memos: Record<string, string>) => void;
  resetDemo: (organizationId: string) => void;
}

export const useReportContentStore = create<ReportContentState>()(
  persist(
    (set, get) => ({
      contents: {},
      loadedKeys: [],
      load: async (organizationId, studentId) => {
        const key = keyFor(organizationId, studentId);
        if (get().loadedKeys.includes(key) || useAuthStore.getState().isDemoMode) return;
        if (!secureBackendEnabled) throw new Error('REPORT_CONTENT_BACKEND_REQUIRED');
        const { data, error } = await supabase
          .from('report_teacher_contents')
          .select('organization_id,student_id,teacher_one_line_memo,updated_at')
          .eq('organization_id', organizationId)
          .eq('student_id', studentId)
          .maybeSingle();
        if (error) throw new Error(error.code === '42P01' || error.code === 'PGRST205' ? 'REPORT_CONTENT_MIGRATION_REQUIRED' : error.message);
        set((state) => ({
          loadedKeys: [...new Set([...state.loadedKeys, key])],
          contents: data ? {
            ...state.contents,
            [key]: {
              organizationId: data.organization_id,
              studentId: data.student_id,
              teacherOneLineMemo: data.teacher_one_line_memo ?? '',
              updatedAt: data.updated_at,
            },
          } : state.contents,
        }));
      },
      saveMemo: async (organizationId, studentId, rawMemo) => {
        const memo = rawMemo.trim();
        if (memo.length > 150) throw new Error('MEMO_TOO_LONG');
        const active = useMembershipStore.getState().getActiveMembership();
        if (!active || active.organizationId !== organizationId || !isFacilitatorMembership(active.role)) throw new Error('REPORT_FORBIDDEN');
        const now = new Date().toISOString();
        if (!useAuthStore.getState().isDemoMode) {
          if (!secureBackendEnabled) throw new Error('REPORT_CONTENT_BACKEND_REQUIRED');
          const { data, error } = await supabase.rpc('upsert_report_teacher_content', {
            target_org: organizationId,
            target_student: studentId,
            one_line_memo: memo,
          });
          if (error) throw new Error(error.code === 'PGRST202' ? 'REPORT_CONTENT_MIGRATION_REQUIRED' : error.message);
          const row = data as { organization_id: string; student_id: string; teacher_one_line_memo: string; updated_at: string };
          set((state) => ({
            loadedKeys: [...new Set([...state.loadedKeys, keyFor(organizationId, studentId)])],
            contents: {
              ...state.contents,
              [keyFor(organizationId, studentId)]: {
                organizationId: row.organization_id,
                studentId: row.student_id,
                teacherOneLineMemo: row.teacher_one_line_memo ?? '',
                updatedAt: row.updated_at,
              },
            },
          }));
          return;
        }
        set((state) => ({
          contents: {
            ...state.contents,
            [keyFor(organizationId, studentId)]: { organizationId, studentId, teacherOneLineMemo: memo, updatedAt: now },
          },
        }));
      },
      getMemo: (organizationId, studentId) => organizationId && studentId
        ? get().contents[keyFor(organizationId, studentId)]?.teacherOneLineMemo ?? ''
        : '',
      seedDemoMemos: (organizationId, memos) => set((state) => {
        const contents = { ...state.contents };
        for (const [studentId, memo] of Object.entries(memos)) {
          const key = keyFor(organizationId, studentId);
          if (!contents[key]) contents[key] = { organizationId, studentId, teacherOneLineMemo: memo, updatedAt: new Date().toISOString() };
        }
        return { contents };
      }),
      resetDemo: (organizationId) => set((state) => ({
        contents: Object.fromEntries(Object.entries(state.contents).filter(([key]) => !key.startsWith(`${organizationId}::`))),
        loadedKeys: state.loadedKeys.filter((key) => !key.startsWith(`${organizationId}::`)),
      })),
    }),
    {
      name: 'mp-report-content',
      partialize: (state) => ({
        contents: Object.fromEntries(Object.entries(state.contents).filter(([key]) => key.startsWith('demo-org-'))),
        loadedKeys: [],
      }),
    },
  ),
);
