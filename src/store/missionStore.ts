import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission, MissionSubmission, MissionReviewLog, MissionStatus } from '../types';
import { initialMissions } from '../data/mockData';

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

interface MissionState {
  missions: Mission[];
  submissions: MissionSubmission[];
  reviewLogs: MissionReviewLog[];

  initializeData: () => void;
  createMission: (data: Omit<Mission, 'id' | 'createdAt' | 'status'>) => Mission;
  updateStatus: (missionId: string, status: MissionStatus) => void;
  deleteMission: (missionId: string) => void;
  submitMission: (
    missionId: string,
    userId: string,
    message?: string,
    imageUrl?: string
  ) => MissionSubmission;
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

      initializeData: () => {
        if (get().missions.length === 0) {
          set({ missions: initialMissions });
        }
      },

      createMission: (data) => {
        const mission: Mission = {
          ...data,
          id: genId(),
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ missions: [...s.missions, mission] }));
        return mission;
      },

      updateStatus: (missionId, status) => {
        set((s) => ({
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status } : m
          ),
        }));
      },

      deleteMission: (missionId) => {
        set((s) => ({
          missions: s.missions.filter((m) => m.id !== missionId),
        }));
      },

      submitMission: (missionId, userId, message, imageUrl) => {
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
        set((s) => ({
          submissions: [...s.submissions, submission],
          missions: s.missions.map((m) =>
            m.id === missionId ? { ...m, status: 'REVIEWING' } : m
          ),
        }));
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
