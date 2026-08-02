import { create } from 'zustand';
import type {
  Guardian,
  GuardianRelationship,
  GuardianReport,
  GuardianReportAccessLog,
  ReportSnapshot,
  StudentGuardian,
} from '../types';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

const id = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

const rowToGuardian = (row: Record<string, unknown>): Guardian => ({
  id: row.id as string,
  organizationId: row.organization_id as string,
  authUserId: (row.auth_user_id as string | null) ?? undefined,
  name: row.name as string,
  phone: (row.phone as string | null) ?? undefined,
  email: (row.email as string | null) ?? undefined,
  notificationsEnabled: row.notifications_enabled !== false,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

const rowToLink = (row: Record<string, unknown>): StudentGuardian => ({
  id: row.id as string,
  organizationId: row.organization_id as string,
  studentId: row.student_id as string,
  guardianId: row.guardian_id as string,
  relationship: row.relationship as GuardianRelationship,
  isPrimary: Boolean(row.is_primary),
  status: row.status as StudentGuardian['status'],
  createdAt: row.created_at as string,
});

const rowToReport = (row: Record<string, unknown>, logs: GuardianReportAccessLog[]): GuardianReport => ({
  id: row.id as string,
  organizationId: row.organization_id as string,
  studentId: row.student_id as string,
  createdBy: row.created_by as string,
  snapshot: row.snapshot as ReportSnapshot,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
  lastViewedAt: logs.filter((log) => log.reportId === row.id).sort((a, b) => Date.parse(b.viewedAt) - Date.parse(a.viewedAt))[0]?.viewedAt,
});

interface GuardianInput {
  id?: string;
  studentId: string;
  name: string;
  relationship: GuardianRelationship;
  phone?: string;
  email?: string;
  isPrimary: boolean;
}

interface GuardianState {
  guardians: Guardian[];
  links: StudentGuardian[];
  reports: GuardianReport[];
  accessLogs: GuardianReportAccessLog[];
  initializedOrganizationId: string | null;
  selectedStudentId: string | null;
  initializeData: (organizationId: string) => Promise<void>;
  upsertGuardian: (organizationId: string, input: GuardianInput) => Promise<void>;
  unlinkGuardian: (organizationId: string, studentId: string, guardianId: string) => Promise<void>;
  updateNotifications: (guardianId: string, enabled: boolean) => Promise<void>;
  markReportViewed: (reportId: string) => Promise<void>;
  setSelectedStudent: (studentId: string) => void;
  seedDemo: (guardians: Guardian[], links: StudentGuardian[], reports: GuardianReport[]) => void;
  clear: () => void;
}

export const useGuardianStore = create<GuardianState>((set, get) => ({
  guardians: [],
  links: [],
  reports: [],
  accessLogs: [],
  initializedOrganizationId: null,
  selectedStudentId: null,

  initializeData: async (organizationId) => {
    if (useAuthStore.getState().isDemoMode) return;
    const [{ data: guardianRows, error: guardianError }, { data: linkRows, error: linkError }, { data: reportRows, error: reportError }, { data: logRows, error: logError }] = await Promise.all([
      supabase.from('guardians').select('*').eq('organization_id', organizationId),
      supabase.from('student_guardians').select('*').eq('organization_id', organizationId).eq('status', 'ACTIVE'),
      supabase.from('reports').select('*').eq('organization_id', organizationId).order('created_at', { ascending: false }),
      supabase.from('guardian_report_access_logs').select('*').eq('organization_id', organizationId).order('viewed_at', { ascending: false }),
    ]);
    if (guardianError || linkError || reportError || logError) {
      throw new Error(guardianError?.message ?? linkError?.message ?? reportError?.message ?? logError?.message ?? '보호자 정보를 불러오지 못했습니다.');
    }
    const accessLogs: GuardianReportAccessLog[] = (logRows ?? []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      guardianId: row.guardian_id ?? undefined,
      reportId: row.report_id,
      publicReportTokenId: row.public_report_token_id ?? undefined,
      viewedAt: row.viewed_at,
    }));
    const links = (linkRows ?? []).map((row) => rowToLink(row));
    const selectedStudentId = get().selectedStudentId && links.some((link) => link.studentId === get().selectedStudentId)
      ? get().selectedStudentId
      : links[0]?.studentId ?? null;
    set({
      guardians: (guardianRows ?? []).map((row) => rowToGuardian(row)),
      links,
      reports: (reportRows ?? []).map((row) => rowToReport(row, accessLogs)),
      accessLogs,
      initializedOrganizationId: organizationId,
      selectedStudentId,
    });
  },

  upsertGuardian: async (organizationId, input) => {
    const current = get().guardians.find((guardian) => guardian.id === input.id);
    if (useAuthStore.getState().isDemoMode) {
      const guardianId = input.id ?? id('demo-guardian');
      const timestamp = now();
      const guardian: Guardian = { id: guardianId, organizationId, name: input.name.trim(), phone: input.phone?.trim() || undefined, email: input.email?.trim().toLowerCase() || undefined, notificationsEnabled: current?.notificationsEnabled ?? true, createdAt: current?.createdAt ?? timestamp, updatedAt: timestamp };
      const link: StudentGuardian = { id: get().links.find((item) => item.studentId === input.studentId && item.guardianId === guardianId)?.id ?? id('demo-student-guardian'), organizationId, studentId: input.studentId, guardianId, relationship: input.relationship, isPrimary: input.isPrimary, status: 'ACTIVE', createdAt: timestamp };
      set((state) => ({
        guardians: state.guardians.some((item) => item.id === guardianId) ? state.guardians.map((item) => item.id === guardianId ? guardian : item) : [...state.guardians, guardian],
        links: state.links.some((item) => item.id === link.id) ? state.links.map((item) => item.id === link.id ? link : input.isPrimary && item.studentId === input.studentId ? { ...item, isPrimary: false } : item) : [...state.links.map((item) => input.isPrimary && item.studentId === input.studentId ? { ...item, isPrimary: false } : item), link],
      }));
      return;
    }
    const { error } = await supabase.rpc('upsert_student_guardian', {
      target_org: organizationId,
      target_student: input.studentId,
      target_guardian: input.id ?? null,
      guardian_name: input.name.trim(),
      guardian_relationship: input.relationship,
      guardian_phone: input.phone?.trim() || null,
      guardian_email: input.email?.trim().toLowerCase() || null,
      primary_guardian: input.isPrimary,
    });
    if (error) throw new Error(error.message);
    await get().initializeData(organizationId);
  },

  unlinkGuardian: async (organizationId, studentId, guardianId) => {
    if (useAuthStore.getState().isDemoMode) {
      set((state) => ({ links: state.links.filter((link) => !(link.studentId === studentId && link.guardianId === guardianId)) }));
      return;
    }
    const { error } = await supabase.rpc('unlink_student_guardian', { target_org: organizationId, target_student: studentId, target_guardian: guardianId });
    if (error) throw new Error(error.message);
    await get().initializeData(organizationId);
  },

  updateNotifications: async (guardianId, enabled) => {
    const guardian = get().guardians.find((item) => item.id === guardianId);
    if (!guardian) return;
    if (!useAuthStore.getState().isDemoMode) {
      const { error } = await supabase.from('guardians').update({ notifications_enabled: enabled, updated_at: now() }).eq('id', guardianId);
      if (error) throw new Error(error.message);
    }
    set((state) => ({ guardians: state.guardians.map((item) => item.id === guardianId ? { ...item, notificationsEnabled: enabled, updatedAt: now() } : item) }));
  },

  markReportViewed: async (reportId) => {
    if (useAuthStore.getState().isDemoMode) {
      set((state) => ({ reports: state.reports.map((report) => report.id === reportId ? { ...report, lastViewedAt: now() } : report) }));
      return;
    }
    const { error } = await supabase.rpc('mark_guardian_report_viewed', { target_report: reportId });
    if (error) throw new Error(error.message);
    const active = get().initializedOrganizationId;
    if (active) await get().initializeData(active);
  },

  setSelectedStudent: (selectedStudentId) => set({ selectedStudentId }),
  seedDemo: (guardians, links, reports) => set({ guardians, links, reports, accessLogs: [], initializedOrganizationId: guardians[0]?.organizationId ?? null, selectedStudentId: links[0]?.studentId ?? null }),
  clear: () => set({ guardians: [], links: [], reports: [], accessLogs: [], initializedOrganizationId: null, selectedStudentId: null }),
}));
