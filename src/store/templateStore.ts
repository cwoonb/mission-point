import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MissionType, MissionGoal, RepeatType, ParentShareType, SubmissionType } from '../types';
import { missionTypeLabel } from '../utils/studentStats';

export interface MissionTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  rewardPoint: number;
  submissionType: SubmissionType;
  missionType?: MissionType;
  missionGoal?: MissionGoal;
  repeatType?: RepeatType;
  parentShare?: ParentShareType;
  createdAt: string;
  usageCount: number;
}

const MISSION_TYPE_EMOJI: Record<string, string> = {
  HOMEWORK: '📝', VOCABULARY: '📖', READING: '📚', ATTENDANCE: '✅',
  REVIEW_NOTES: '✏️', LIFESTYLE: '🌱', OTHER: '🎯',
};

export function getTemplateEmoji(t: MissionTemplate) {
  return MISSION_TYPE_EMOJI[t.missionType ?? 'OTHER'] ?? '🎯';
}

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

const DEFAULT_TEMPLATES: MissionTemplate[] = [
  {
    id: 'tmpl-hw', name: '수학 숙제', title: '수학 숙제 완료하기',
    description: '오늘의 수학 숙제를 완료하고 사진으로 제출하세요.',
    rewardPoint: 100, submissionType: 'IMAGE', missionType: 'HOMEWORK',
    missionGoal: 'SUBMISSION_MGMT', repeatType: 'DAILY', parentShare: 'NONE',
    createdAt: new Date().toISOString(), usageCount: 3,
  },
  {
    id: 'tmpl-voc', name: '영단어 암기', title: '영단어 20개 암기',
    description: '교재 단어 20개를 외우고 예문과 함께 정리하여 제출하세요.',
    rewardPoint: 80, submissionType: 'IMAGE', missionType: 'VOCABULARY',
    missionGoal: 'STUDY_HABIT', repeatType: 'DAILY', parentShare: 'NONE',
    createdAt: new Date().toISOString(), usageCount: 5,
  },
  {
    id: 'tmpl-read', name: '독서 30분', title: '독서 30분 완료',
    description: '책을 30분 이상 읽고 오늘 읽은 내용과 느낀점을 글로 제출하세요.',
    rewardPoint: 120, submissionType: 'TEXT', missionType: 'READING',
    missionGoal: 'STUDY_HABIT', repeatType: 'WEEKDAYS', parentShare: 'WEEKLY_REPORT',
    createdAt: new Date().toISOString(), usageCount: 2,
  },
  {
    id: 'tmpl-notes', name: '오답 노트', title: '오답노트 정리하기',
    description: '틀린 문제를 오답 노트에 정리하고 사진으로 제출하세요.',
    rewardPoint: 150, submissionType: 'IMAGE', missionType: 'REVIEW_NOTES',
    missionGoal: 'SINCERITY', repeatType: 'WEEKLY', parentShare: 'NONE',
    createdAt: new Date().toISOString(), usageCount: 1,
  },
  {
    id: 'tmpl-life', name: '생활 습관', title: '오늘의 생활습관 미션',
    description: '정해진 시간에 잠자리에 들기, 식사 후 양치하기 등 오늘의 생활습관을 실천하고 인증하세요.',
    rewardPoint: 50, submissionType: 'IMAGE', missionType: 'LIFESTYLE',
    missionGoal: 'SINCERITY', repeatType: 'DAILY', parentShare: 'NONE',
    createdAt: new Date().toISOString(), usageCount: 0,
  },
];

interface TemplateState {
  templates: MissionTemplate[];
  saveTemplate: (data: Omit<MissionTemplate, 'id' | 'createdAt' | 'usageCount'>) => void;
  deleteTemplate: (id: string) => void;
  incrementUsage: (id: string) => void;
  initializeData: () => void;
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      templates: [],

      initializeData: () => {
        const existing = get().templates;
        if (existing.length > 0) return;
        set({ templates: DEFAULT_TEMPLATES });
      },

      saveTemplate: (data) => {
        const t: MissionTemplate = { ...data, id: genId(), createdAt: new Date().toISOString(), usageCount: 0 };
        set((s) => ({ templates: [t, ...s.templates] }));
      },

      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),

      incrementUsage: (id) =>
        set((s) => ({
          templates: s.templates.map((t) => t.id === id ? { ...t, usageCount: t.usageCount + 1 } : t),
        })),
    }),
    { name: 'mp-templates' }
  )
);

export { missionTypeLabel };
