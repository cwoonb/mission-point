import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission, MissionSubmission, MissionReviewLog, MissionStatus, MissionType, MissionGoal, RepeatType, ParentShareType, SubmissionType, ReviewAction } from '../types';
import { supabase } from '../lib/supabase';
import { useMembershipStore } from './membershipStore';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

function calcNextRepeatDates(repeatType: RepeatType): { startDate: string; endDate: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (repeatType === 'DAILY') {
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (repeatType === 'WEEKLY') {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  if (repeatType === 'WEEKDAYS') {
    while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);
    const end = new Date(start);
    while (end.getDay() !== 5) end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  end.setHours(23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

// ── Supabase <-> App 모델 변환 ──────────────────────────────
interface MissionRow {
  id: string;
  title: string;
  description: string;
  reward_point: number;
  creator_id: string;
  assignee_id: string;
  status: MissionStatus;
  submission_type: SubmissionType;
  start_date: string;
  end_date: string;
  mission_type: MissionType | null;
  mission_goal: MissionGoal | null;
  repeat_type: RepeatType | null;
  parent_share: ParentShareType | null;
  organization_id?: string | null;
  created_at: string;
}
interface SubmissionRow {
  id: string;
  mission_id: string;
  user_id: string;
  message: string | null;
  image_url: string | null;
  attempt_number: number;
  submitted_at: string;
}
interface ReviewLogRow {
  id: string;
  mission_id: string;
  submission_id: string;
  reviewer_id: string;
  action: ReviewAction;
  reason: string | null;
  created_at: string;
}

const rowToMission = (r: MissionRow): Mission => ({
  id: r.id,
  title: r.title,
  description: r.description,
  rewardPoint: r.reward_point,
  creatorId: r.creator_id,
  assigneeId: r.assignee_id,
  status: r.status,
  submissionType: r.submission_type,
  startDate: r.start_date,
  endDate: r.end_date,
  createdAt: r.created_at,
  missionType: r.mission_type ?? undefined,
  missionGoal: r.mission_goal ?? undefined,
  repeatType: r.repeat_type ?? undefined,
  parentShare: r.parent_share ?? undefined,
  organizationId: r.organization_id ?? undefined,
});

const missionToRow = (m: Mission) => ({
  id: m.id,
  title: m.title,
  description: m.description,
  reward_point: m.rewardPoint,
  creator_id: m.creatorId,
  assignee_id: m.assigneeId,
  status: m.status,
  submission_type: m.submissionType,
  start_date: m.startDate,
  end_date: m.endDate,
  mission_type: m.missionType ?? null,
  mission_goal: m.missionGoal ?? null,
  repeat_type: m.repeatType ?? null,
  parent_share: m.parentShare ?? null,
  ...(m.organizationId ? { organization_id: m.organizationId } : {}),
  created_at: m.createdAt,
});

const rowToSubmission = (r: SubmissionRow): MissionSubmission => ({
  id: r.id,
  missionId: r.mission_id,
  userId: r.user_id,
  message: r.message ?? undefined,
  imageUrl: r.image_url ?? undefined,
  attemptNumber: r.attempt_number,
  submittedAt: r.submitted_at,
});

const rowToReviewLog = (r: ReviewLogRow): MissionReviewLog => ({
  id: r.id,
  missionId: r.mission_id,
  submissionId: r.submission_id,
  reviewerId: r.reviewer_id,
  action: r.action,
  reason: r.reason ?? undefined,
  createdAt: r.created_at,
});

const pushMissionUpdate = (missionId: string, patch: Record<string, unknown>) => {
  supabase.from('missions').update(patch).eq('id', missionId).then(({ error }) => {
    if (error) console.error('Supabase mission update failed:', error.message);
  });
};

interface MissionState {
  missions: Mission[];
  submissions: MissionSubmission[];
  reviewLogs: MissionReviewLog[];
  demoMode: boolean;

  initializeData: () => Promise<void>;
  autoGenerateRepeatMissions: () => void;
  createMission: (data: Omit<Mission, 'id' | 'createdAt' | 'status'>) => Promise<Mission>;
  updateMission: (missionId: string, data: Partial<Pick<Mission, 'title' | 'description' | 'rewardPoint' | 'submissionType' | 'startDate' | 'endDate' | 'assigneeId'>>) => void;
  updateStatus: (missionId: string, status: MissionStatus) => void;
  deleteMission: (missionId: string) => void;
  submitMission: (
    missionId: string,
    userId: string,
    message?: string,
    imageUrl?: string,
    imageUrls?: string[]
  ) => Promise<MissionSubmission>;
  approveMission: (missionId: string, reviewerId: string, feedback?: string) => Promise<void>;
  rejectMission: (missionId: string, reviewerId: string, reason: string) => Promise<void>;
  getLatestSubmission: (missionId: string) => MissionSubmission | undefined;
  getReviewLogs: (missionId: string) => MissionReviewLog[];
  getMission: (missionId: string) => Mission | undefined;
}

export const useMissionStore = create<MissionState>()(
  persist(
    (set, get) => ({
      missions: [],
      submissions: [],
      reviewLogs: [],
      demoMode: false,

      initializeData: async () => {
        if (get().demoMode) return;
        const [{ data: missionRows, error: mErr }, { data: subRows, error: sErr }, { data: logRows, error: lErr }] = await Promise.all([
          supabase.from('missions').select('*'),
          supabase.from('mission_submissions').select('*'),
          supabase.from('mission_review_logs').select('*'),
        ]);
        if (mErr || sErr || lErr) {
          console.error('Failed to load mission data:', mErr?.message ?? sErr?.message ?? lErr?.message);
          return;
        }
        if (get().demoMode) return;

        set({
          missions: (missionRows ?? []).map(rowToMission),
          submissions: (subRows ?? []).map(rowToSubmission),
          reviewLogs: (logRows ?? []).map(rowToReviewLog),
        });
      },

      autoGenerateRepeatMissions: () => {
        if (get().demoMode) return;
        const missions = get().missions;
        const now = new Date();
        const repeatMissions = missions.filter((m) => m.repeatType && m.repeatType !== 'ONCE');
        if (repeatMissions.length === 0) return;

        const seriesMap = new Map<string, Mission[]>();
        for (const m of repeatMissions) {
          const key = `${m.creatorId}||${m.assigneeId}||${m.title}`;
          if (!seriesMap.has(key)) seriesMap.set(key, []);
          seriesMap.get(key)!.push(m);
        }

        const toExpire: string[] = [];
        const toCreate: Mission[] = [];

        for (const [, series] of seriesMap) {
          const sorted = [...series].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const latest = sorted[0];

          if (latest.status === 'IN_PROGRESS' && new Date(latest.endDate) < now) {
            toExpire.push(latest.id);
          }

          const hasActive = series.some(
            (m) => (m.status === 'IN_PROGRESS' && new Date(m.endDate) >= now) || m.status === 'REVIEWING'
          );
          if (hasActive) continue;

          const terminal: MissionStatus[] = ['SUCCESS', 'REJECTED', 'EXPIRED', 'FAILED'];
          const isTerminal = terminal.includes(latest.status) ||
            (latest.status === 'IN_PROGRESS' && new Date(latest.endDate) < now);
          if (!isTerminal) continue;

          const dates = calcNextRepeatDates(latest.repeatType!);
          toCreate.push({
            ...latest,
            id: genId(),
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString(),
            startDate: dates.startDate,
            endDate: dates.endDate,
          });
        }

        if (toCreate.length === 0 && toExpire.length === 0) return;
        set((s) => ({
          missions: [
            ...s.missions.map((m) =>
              toExpire.includes(m.id) ? { ...m, status: 'EXPIRED' as MissionStatus } : m
            ),
            ...toCreate,
          ],
        }));
        for (const id of toExpire) pushMissionUpdate(id, { status: 'EXPIRED' });
        if (toCreate.length > 0) {
          supabase.from('missions').insert(toCreate.map(missionToRow)).then(({ error }) => {
            if (error) console.error('Failed to create repeat missions in Supabase:', error.message);
          });
        }
      },

      createMission: async (data) => {
        const activeMembership=useMembershipStore.getState().getActiveMembership();
        if (!get().demoMode && !activeMembership?.organizationId) throw new Error('소속을 선택한 뒤 다시 시도해 주세요.');
        const mission: Mission = {
          ...data,
          organizationId: activeMembership?.organizationId,
          id: genId(),
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        };
        if (get().demoMode) {
          set((s) => ({ missions: [...s.missions, mission] }));
          return mission;
        }
        let { data: created, error } = await supabase.from('missions').insert(missionToRow(mission)).select('*').single();
        const legacySchema = error && mission.organizationId?.startsWith('legacy-org-') && (error.code === 'PGRST204' || error.code === '42703' || error.message.includes('organization_id'));
        if (legacySchema) {
          const fallback = await supabase.from('missions').insert(missionToRow({ ...mission, organizationId: undefined })).select('*').single();
          created = fallback.data;
          error = fallback.error;
        }
        if (error) {
          if (error.code === 'PGRST204' || error.code === '42703' || error.message.includes('organization_id')) throw new Error('MISSION_SCHEMA_UPDATE_REQUIRED');
          throw new Error(error.message);
        }
        const result = rowToMission(created as MissionRow);
        set((s) => ({ missions: [...s.missions, result] }));
        return result;
      },

      updateMission: (missionId, data) => {
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, ...data } : m
          ),
        }));
        if (get().demoMode) return;
        const patch: Record<string, unknown> = {};
        if (data.title !== undefined) patch.title = data.title;
        if (data.description !== undefined) patch.description = data.description;
        if (data.rewardPoint !== undefined) patch.reward_point = data.rewardPoint;
        if (data.submissionType !== undefined) patch.submission_type = data.submissionType;
        if (data.startDate !== undefined) patch.start_date = data.startDate;
        if (data.endDate !== undefined) patch.end_date = data.endDate;
        if (data.assigneeId !== undefined) patch.assignee_id = data.assigneeId;
        if (Object.keys(patch).length > 0) pushMissionUpdate(missionId, patch);
      },

      updateStatus: (missionId, status) => {
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status } : m
          ),
        }));
        if (!get().demoMode) pushMissionUpdate(missionId, { status });
      },

      deleteMission: (missionId) => {
        set((s) => ({
          missions: s.missions.filter((m) => m.id !== missionId),
        }));
        if (get().demoMode) return;
        supabase.from('missions').delete().eq('id', missionId).then(({ error }) => {
          if (error) console.error('Failed to delete mission in Supabase:', error.message);
        });
      },

      submitMission: async (missionId, userId, message, imageUrl, imageUrls) => {
        const existing = get().submissions.filter(
          (s) => s.missionId === missionId && s.userId === userId
        );
        const submission: MissionSubmission = {
          id: genId(),
          missionId,
          userId,
          message,
          imageUrl,
          imageUrls: imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : undefined,
          attemptNumber: existing.length + 1,
          submittedAt: new Date().toISOString(),
        };

        if (!get().demoMode) {
          const { error: subError } = await supabase.from('mission_submissions').insert({
            id: submission.id,
            mission_id: submission.missionId,
            user_id: submission.userId,
            message: submission.message ?? null,
            image_url: submission.imageUrl ?? null,
            attempt_number: submission.attemptNumber,
            submitted_at: submission.submittedAt,
          });
          if (subError) throw new Error(subError.message);
          const { error: missionError } = await supabase.from('missions').update({ status: 'REVIEWING' }).eq('id', missionId);
          if (missionError) {
            await supabase.from('mission_submissions').delete().eq('id', submission.id);
            throw new Error(missionError.message);
          }
        }

        set((s) => ({
          submissions: [...s.submissions, submission],
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'REVIEWING' } : m
          ),
        }));
        return submission;
      },

      approveMission: async (missionId, reviewerId, feedback) => {
        const latestSub = get().getLatestSubmission(missionId);
        const log: MissionReviewLog | null = latestSub ? {
          id: genId(),
          missionId,
          submissionId: latestSub.id,
          reviewerId,
          action: 'APPROVED',
          reason: feedback?.trim() || undefined,
          createdAt: new Date().toISOString(),
        } : null;
        if (!get().demoMode) {
          if (!log) throw new Error('승인할 제출물을 찾을 수 없습니다.');
          const { error: logError } = await supabase.from('mission_review_logs').insert({
            id: log.id, mission_id: log.missionId, submission_id: log.submissionId,
            reviewer_id: log.reviewerId, action: log.action, reason: log.reason ?? null, created_at: log.createdAt,
          });
          if (logError) throw new Error(logError.message);
          const { error: missionError } = await supabase.from('missions').update({ status: 'SUCCESS' }).eq('id', missionId);
          if (missionError) {
            await supabase.from('mission_review_logs').delete().eq('id', log.id);
            throw new Error(missionError.message);
          }
        }
        set((s) => ({
          reviewLogs: log ? [...s.reviewLogs, log] : s.reviewLogs,
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'SUCCESS' } : m
          ),
        }));
      },

      rejectMission: async (missionId, reviewerId, reason) => {
        const latestSub = get().getLatestSubmission(missionId);
        const log: MissionReviewLog | null = latestSub ? {
          id: genId(),
          missionId,
          submissionId: latestSub.id,
          reviewerId,
          action: 'REJECTED',
          reason,
          createdAt: new Date().toISOString(),
        } : null;
        if (!get().demoMode) {
          if (!log) throw new Error('반려할 제출물을 찾을 수 없습니다.');
          const { error: logError } = await supabase.from('mission_review_logs').insert({
            id: log.id, mission_id: log.missionId, submission_id: log.submissionId,
            reviewer_id: log.reviewerId, action: log.action, reason: log.reason ?? null, created_at: log.createdAt,
          });
          if (logError) throw new Error(logError.message);
          const { error: missionError } = await supabase.from('missions').update({ status: 'REJECTED' }).eq('id', missionId);
          if (missionError) {
            await supabase.from('mission_review_logs').delete().eq('id', log.id);
            throw new Error(missionError.message);
          }
        }
        set((s) => ({
          reviewLogs: log ? [...s.reviewLogs, log] : s.reviewLogs,
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'REJECTED' } : m
          ),
        }));
      },

      getLatestSubmission: (missionId) => {
        const subs = get().submissions
          .filter((s) => s.missionId === missionId)
          .sort((a, b) => b.attemptNumber - a.attemptNumber);
        return subs[0];
      },

      getReviewLogs: (missionId) =>
        get().reviewLogs
          .filter((l) => l.missionId === missionId)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ),

      getMission: (missionId) =>
        get().missions.find((m) => m.id === missionId),
    }),
    { name: 'mp-missions' }
  )
);
