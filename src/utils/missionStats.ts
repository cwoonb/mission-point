import type { Mission, MissionReviewLog, MissionSubmission, MissionStatus, User } from '../types';

export type MissionDisplayStatus = 'completed' | 'pending' | 'missing' | 'in_progress';

export interface HomeworkStats {
  total: number;
  completed: number;
  pending: number;
  missing: number;
  inProgress: number;
  completionRate: number;
}

const COMPLETED = new Set(['SUCCESS', 'COMPLETED']);
const PENDING = new Set(['REVIEWING', 'SUBMITTED']);
const ACTIVE = new Set(['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'REJECTED']);
const MISSING = new Set(['FAILED', 'EXPIRED']);

export function normalizeMissionStatus(status: MissionStatus | string): MissionStatus {
  if (status === 'COMPLETED') return 'SUCCESS';
  if (status === 'SUBMITTED') return 'REVIEWING';
  if (status === 'ASSIGNED') return 'IN_PROGRESS';
  return status as MissionStatus;
}

export function getLatestSubmissionByMission(
  submissions: MissionSubmission[],
  missionId: string,
): MissionSubmission | undefined {
  return submissions
    .filter((submission) => submission.missionId === missionId)
    .sort((a, b) => {
      const time = new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      return time || b.attemptNumber - a.attemptNumber;
    })[0];
}

export function getLatestReviewByMission(
  logs: MissionReviewLog[],
  missionId: string,
): MissionReviewLog | undefined {
  return logs
    .filter((log) => log.missionId === missionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function getSubmissionDisplayStatus(mission: Mission, now = new Date()): MissionDisplayStatus {
  const raw = String(mission.status);
  if (COMPLETED.has(raw)) return 'completed';
  if (PENDING.has(raw)) return 'pending';
  if (MISSING.has(raw)) return 'missing';
  if (new Date(mission.endDate).getTime() < now.getTime()) return 'missing';
  if (ACTIVE.has(raw)) return 'in_progress';
  return 'in_progress';
}

export function calculateHomeworkStats(missions: Mission[], now = new Date()): HomeworkStats {
  const unique = latestMissionPerStudent(missions);
  const statuses = unique.map((mission) => getSubmissionDisplayStatus(mission, now));
  const completed = statuses.filter((status) => status === 'completed').length;
  const pending = statuses.filter((status) => status === 'pending').length;
  const missing = statuses.filter((status) => status === 'missing').length;
  const inProgress = statuses.filter((status) => status === 'in_progress').length;
  const total = unique.length;
  return {
    total,
    completed,
    pending,
    missing,
    inProgress,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function calculateClassStats(missions: Mission[], now = new Date()): HomeworkStats {
  const latest = new Map<string, Mission>();
  missions.forEach((mission) => {
    const key = `${homeworkKey(mission)}::${mission.assigneeId}`;
    const previous = latest.get(key);
    if (!previous || new Date(mission.createdAt).getTime() >= new Date(previous.createdAt).getTime()) latest.set(key, mission);
  });
  const assignments = [...latest.values()];
  const statuses = assignments.map((mission) => getSubmissionDisplayStatus(mission, now));
  const completed = statuses.filter((status) => status === 'completed').length;
  const pending = statuses.filter((status) => status === 'pending').length;
  const missing = statuses.filter((status) => status === 'missing').length;
  const inProgress = statuses.filter((status) => status === 'in_progress').length;
  const total = assignments.length;
  return { total, completed, pending, missing, inProgress, completionRate: total === 0 ? 0 : Math.round((completed / total) * 100) };
}
export const calculateCompletionCount = (missions: Mission[]) => calculateHomeworkStats(missions).completed;
export const calculatePendingCount = (missions: Mission[]) => calculateHomeworkStats(missions).pending;
export const calculateMissingCount = (missions: Mission[]) => calculateHomeworkStats(missions).missing;
export const calculateInProgressCount = (missions: Mission[]) => calculateHomeworkStats(missions).inProgress;

export function homeworkKey(mission: Mission): string {
  return [mission.creatorId, mission.title.trim(), new Date(mission.endDate).toISOString()].join('::');
}

export function groupMissionsByHomework(missions: Mission[]): Mission[][] {
  const groups = new Map<string, Mission[]>();
  missions.forEach((mission) => {
    const key = homeworkKey(mission);
    groups.set(key, [...(groups.get(key) ?? []), mission]);
  });
  return [...groups.values()].map(latestMissionPerStudent);
}

export function latestMissionPerStudent(missions: Mission[]): Mission[] {
  const latest = new Map<string, Mission>();
  missions.forEach((mission) => {
    const previous = latest.get(mission.assigneeId);
    if (!previous || new Date(mission.createdAt).getTime() >= new Date(previous.createdAt).getTime()) {
      latest.set(mission.assigneeId, mission);
    }
  });
  return [...latest.values()];
}

export function getAssignedStudentsForHomework(missions: Mission[], users: User[]): User[] {
  const ids = new Set(latestMissionPerStudent(missions).map((mission) => mission.assigneeId));
  return users.filter((user) => user.role === 'CHILD' && ids.has(user.id));
}

export function missionsByDisplayStatus(
  missions: Mission[],
  status: MissionDisplayStatus | 'all',
  now = new Date(),
): Mission[] {
  const unique = latestMissionPerStudent(missions);
  return status === 'all'
    ? unique
    : unique.filter((mission) => getSubmissionDisplayStatus(mission, now) === status);
}
