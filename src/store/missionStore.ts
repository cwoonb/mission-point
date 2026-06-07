import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission, MissionSubmission, MissionReviewLog, MissionStatus, MissionType, MissionGoal, RepeatType, ParentShareType, SubmissionType, ReviewAction } from '../types';
import { initialMissions } from '../data/mockData';
import { supabase } from '../lib/supabase';

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
    imageUrl?: string
  ) => Promise<MissionSubmission>;
  approveMission: (missionId: string, reviewerId: string) => void;
  rejectMission: (missionId: string, reviewerId: string, reason: string) => void;
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

      initializeData: async () => {
        const [{ data: missionRows, error: mErr }, { data: subRows, error: sErr }, { data: logRows, error: lErr }] = await Promise.all([
          supabase.from('missions').select('*'),
          supabase.from('mission_submissions').select('*'),
          supabase.from('mission_review_logs').select('*'),
        ]);
        if (mErr || sErr || lErr) {
          console.error('Failed to load mission data:', mErr?.message ?? sErr?.message ?? lErr?.message);
          return;
        }

        let missions = (missionRows ?? []).map(rowToMission);

        if (missions.length === 0) {
          const { data: inserted, error: insertError } = await supabase
            .from('missions')
            .insert(initialMissions.map(missionToRow))
            .select('*');
          if (insertError) {
            if (insertError.code === '23505') {
              const { data: refetched } = await supabase.from('missions').select('*');
              missions = (refetched ?? []).map(rowToMission);
            } else {
              console.error('Failed to seed missions in Supabase:', insertError.message);
            }
          } else {
            missions = (inserted ?? []).map(rowToMission);
          }
        }

        set({
          missions,
          submissions: (subRows ?? []).map(rowToSubmission),
          reviewLogs: (logRows ?? []).map(rowToReviewLog),
        });
      },

      autoGenerateRepeatMissions: () => {
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
        const mission: Mission = {
          ...data,
          id: genId(),
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        };
        const { data: created, error } = await supabase.from('missions').insert(missionToRow(mission)).select('*').single();
        if (error) {
          console.error('Failed to create mission in Supabase:', error.message);
          return mission;
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
        pushMissionUpdate(missionId, { status });
      },

      deleteMission: (missionId) => {
        set((s) => ({
          missions: s.missions.filter((m) => m.id !== missionId),
        }));
        supabase.from('missions').delete().eq('id', missionId).then(({ error }) => {
          if (error) console.error('Failed to delete mission in Supabase:', error.message);
        });
      },

      submitMission: async (missionId, userId, message, imageUrl) => {
        const existing = get().submissions.filter(
          (s) => s.missionId === missionId && s.userId === userId
        );
        const submission: MissionSubmission = {
          id: genId(),
          missionId,
          userId,
          message,
          imageUrl,
          attemptNumber: existing.length + 1,
          submittedAt: new Date().toISOString(),
        };

        const { error: subError } = await supabase.from('mission_submissions').insert({
          id: submission.id,
          mission_id: submission.missionId,
          user_id: submission.userId,
          message: submission.message ?? null,
          image_url: submission.imageUrl ?? null,
          attempt_number: submission.attemptNumber,
          submitted_at: submission.submittedAt,
        });
        if (subError) console.error('Failed to save submission in Supabase:', subError.message);

        set((s) => ({
          submissions: [...s.submissions, submission],
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'REVIEWING' } : m
          ),
        }));
        pushMissionUpdate(missionId, { status: 'REVIEWING' });
        return submission;
      },

      approveMission: (missionId, reviewerId) => {
        const latestSub = get().getLatestSubmission(missionId);
        const log: MissionReviewLog = {
          id: genId(),
          missionId,
          submissionId: latestSub?.id ?? '',
          reviewerId,
          action: 'APPROVED',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          reviewLogs: [...s.reviewLogs, log],
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'SUCCESS' } : m
          ),
        }));
        pushMissionUpdate(missionId, { status: 'SUCCESS' });
        supabase.from('mission_review_logs').insert({
          id: log.id, mission_id: log.missionId, submission_id: log.submissionId,
          reviewer_id: log.reviewerId, action: log.action, reason: log.reason ?? null, created_at: log.createdAt,
        }).then(({ error }) => {
          if (error) console.error('Failed to save review log in Supabase:', error.message);
        });
      },

      rejectMission: (missionId, reviewerId, reason) => {
        const latestSub = get().getLatestSubmission(missionId);
        const log: MissionReviewLog = {
          id: genId(),
          missionId,
          submissionId: latestSub?.id ?? '',
          reviewerId,
          action: 'REJECTED',
          reason,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          reviewLogs: [...s.reviewLogs, log],
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'REJECTED' } : m
          ),
        }));
        pushMissionUpdate(missionId, { status: 'REJECTED' });
        supabase.from('mission_review_logs').insert({
          id: log.id, mission_id: log.missionId, submission_id: log.submissionId,
          reviewer_id: log.reviewerId, action: log.action, reason: log.reason ?? null, created_at: log.createdAt,
        }).then(({ error }) => {
          if (error) console.error('Failed to save review log in Supabase:', error.message);
        });
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
