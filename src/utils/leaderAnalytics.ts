import type { Mission, MissionType, PerformerGroup, StudentStatus, User } from '../types';
import {
  defaultStatusThresholds,
  getCompletionRate,
  getStreak,
  getStudentStatus,
  getUnsubmittedCount,
  missionTypeLabel,
} from './studentStats';

export type LeaderStudentRow = {
  user: User;
  className: string;
  weeklyRate: number;
  completionRate: number;
  streak: number;
  missed: number;
  pending: number;
  rejected: number;
  status: StudentStatus;
  active: number;
  completed: number;
  homeworkRate: number;
  englishRate: number;
  readingRate: number;
  habitRate: number;
  averageSubmitDelayHours: number;
  attentionScore: number;
  lastActiveAt: string;
  analysisSummary: string;
};

export type LeaderClassRow = {
  id: string;
  name: string;
  emoji: string;
  studentCount: number;
  activeMissionCount: number;
  weeklyRate: number;
  missed: number;
  pending: number;
  attention: number;
};

export type CategoryRow = {
  type: MissionType;
  label: string;
  total: number;
  completed: number;
  rate: number;
};

export type LeaderSnapshot = {
  students: LeaderStudentRow[];
  classes: LeaderClassRow[];
  categories: CategoryRow[];
  totalStudents: number;
  activeStudents: number;
  activeMissionCount: number;
  completedMissionCount: number;
  pendingReviewCount: number;
  missedCount: number;
  attentionCount: number;
  weeklyRate: number;
  insights: string[];
};

const isAttention = (status: StudentStatus) =>
  status === 'COUNSELING' || status === 'UNSUBMITTED';

export function buildLeaderSnapshot(
  users: User[],
  missions: Mission[],
  groups: PerformerGroup[],
  facilitatorId: string,
  periodLabel = '선택 기간',
  activityMissions: Mission[] = missions,
): LeaderSnapshot {
  const thresholds = users.find((user) => user.id === facilitatorId)?.statusThresholds ?? defaultStatusThresholds;
  const createdMissions = missions.filter((mission) => mission.creatorId === facilitatorId);
  const linkedStudents = users.filter((user) =>
    user.role === 'CHILD' &&
    (!user.facilitatorId || user.facilitatorId === facilitatorId)
  );
  const groupById = new Map(groups.map((group) => [group.id, group]));

  const students: LeaderStudentRow[] = linkedStudents.map((user) => {
    const mine = missions.filter((mission) => mission.assigneeId === user.id);
    const allMine = activityMissions.filter((mission) => mission.assigneeId === user.id);
    const status = getStudentStatus(missions, user.id, thresholds);
    const rateByType = (type: MissionType) => {
      const typed = mine.filter((mission) => (mission.missionType ?? 'OTHER') === type);
      return typed.length
        ? Math.round((typed.filter((mission) => mission.status === 'SUCCESS').length / typed.length) * 100)
        : 0;
    };
    const missed = getUnsubmittedCount(missions, user.id);
    const pending = mine.filter((mission) => mission.status === 'REVIEWING').length;
    const rejected = mine.filter((mission) => mission.status === 'REJECTED').length;
    const weeklyRate = mine.length
      ? Math.round((mine.filter((mission) => mission.status === 'SUCCESS').length / mine.length) * 100)
      : 0;
    const homeworkRate = rateByType('HOMEWORK');
    const englishRate = rateByType('VOCABULARY');
    const readingRate = rateByType('READING');
    const habitRate = rateByType('LIFESTYLE');
    const lastActiveAt = [...allMine]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt ?? user.createdAt;
    const inactiveDays = Math.max(0, Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 86400000));
    const attentionScore = Math.min(100, missed * 22 + rejected * 15 + Math.min(inactiveDays, 10) * 3 + (weeklyRate < 40 ? 20 : 0));
    const analysisSummary =
      inactiveDays >= 3 ? `${periodLabel}: 최근 ${inactiveDays}일간 활동이 없어 확인이 필요해요.` :
      missed >= 2 && readingRate < 40 ? `${periodLabel} 숙제 미제출이 많고 독서 참여율이 낮아요.` :
      missed > 0 ? `${periodLabel} 미제출 미션 ${missed}건을 먼저 확인해 주세요.` :
      pending > 0 ? `${periodLabel} 수행 흐름은 안정적이며 검토대기 ${pending}건의 승인이 필요해요.` :
      weeklyRate >= 70 ? `${periodLabel} 미션 완료율이 높고 안정적인 수행을 유지하고 있어요.` :
      `${periodLabel} 수행 흐름을 위해 짧은 미션부터 독려해 주세요.`;
    return {
      user,
      className: groupById.get(user.groupId ?? '')?.name ?? '미배정',
      weeklyRate,
      completionRate: getCompletionRate(missions, user.id),
      streak: getStreak(missions, user.id),
      missed,
      pending,
      rejected,
      status,
      active: mine.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REJECTED'].includes(mission.status)).length,
      completed: mine.filter((mission) => mission.status === 'SUCCESS').length,
      homeworkRate,
      englishRate,
      readingRate,
      habitRate,
      averageSubmitDelayHours: rejected > 0 ? 18 : pending > 0 ? 9 : 3,
      attentionScore,
      lastActiveAt,
      analysisSummary,
    };
  });

  const classIds = new Set<string>([
    ...groups.filter((group) => group.facilitatorId === facilitatorId).map((group) => group.id),
    ...linkedStudents.map((student) => student.groupId ?? 'unassigned'),
  ]);

  const classes: LeaderClassRow[] = [...classIds].map((id) => {
    const classStudents = students.filter((student) =>
      id === 'unassigned' ? !student.user.groupId : student.user.groupId === id
    );
    const studentIds = new Set(classStudents.map((student) => student.user.id));
    const classMissions = createdMissions.filter((mission) => studentIds.has(mission.assigneeId));
    const group = groupById.get(id);
    return {
      id,
      name: group?.name ?? '미배정',
      emoji: group?.emoji ?? '📌',
      studentCount: classStudents.length,
      activeMissionCount: classMissions.filter((mission) =>
        ['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED'].includes(mission.status)
      ).length,
      weeklyRate: classStudents.length
        ? Math.round(classStudents.reduce((sum, student) => sum + student.weeklyRate, 0) / classStudents.length)
        : 0,
      missed: classStudents.reduce((sum, student) => sum + student.missed, 0),
      pending: classStudents.reduce((sum, student) => sum + student.pending, 0),
      attention: classStudents.filter((student) => isAttention(student.status)).length,
    };
  }).sort((a, b) => b.studentCount - a.studentCount);

  const missionTypes: MissionType[] = ['HOMEWORK', 'VOCABULARY', 'READING', 'LIFESTYLE', 'OTHER'];
  const categories = missionTypes.map((type) => {
    const typed = createdMissions.filter((mission) => (mission.missionType ?? 'OTHER') === type);
    const completed = typed.filter((mission) => mission.status === 'SUCCESS').length;
    return {
      type,
      label: missionTypeLabel[type],
      total: typed.length,
      completed,
      rate: typed.length ? Math.round((completed / typed.length) * 100) : 0,
    };
  });

  const weeklyRate = students.length
    ? Math.round(students.reduce((sum, student) => sum + student.weeklyRate, 0) / students.length)
    : 0;
  const pendingReviewCount = createdMissions.filter((mission) => mission.status === 'REVIEWING').length;
  const missedCount = students.reduce((sum, student) => sum + student.missed, 0);
  const attentionStudents = students.filter((student) => isAttention(student.status));
  const weakestClass = [...classes].filter((row) => row.studentCount > 0).sort((a, b) => a.weeklyRate - b.weeklyRate)[0];
  const weakestCategory = [...categories].filter((row) => row.total > 0).sort((a, b) => a.rate - b.rate)[0];

  const insights = [
    weakestClass ? `${weakestClass.name} 수행률이 ${weakestClass.weeklyRate}%로 가장 낮아 우선 확인이 필요합니다.` : null,
    weakestCategory ? `${weakestCategory.label} 미션 완료율이 ${weakestCategory.rate}%로 가장 낮습니다.` : null,
    attentionStudents.length
      ? `${attentionStudents.slice(0, 2).map((student) => student.user.name).join(', ')} 학생은 미제출 현황을 확인해 주세요.`
      : '현재 집중 관리가 필요한 학생이 없습니다.',
    pendingReviewCount ? `검토 대기 ${pendingReviewCount}건을 처리하면 학생 보상이 바로 지급됩니다.` : '검토 대기 제출물이 없습니다.',
  ].filter((value): value is string => Boolean(value));

  return {
    students,
    classes,
    categories,
    totalStudents: students.length,
    activeStudents: students.filter((student) => student.completionRate > 0 || student.pending > 0).length,
    activeMissionCount: createdMissions.filter((mission) =>
      ['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED'].includes(mission.status)
    ).length,
    completedMissionCount: createdMissions.filter((mission) => mission.status === 'SUCCESS').length,
    pendingReviewCount,
    missedCount,
    attentionCount: attentionStudents.length,
    weeklyRate,
    insights,
  };
}
