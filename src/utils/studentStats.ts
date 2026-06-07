import type { Mission, StudentStatus, StatusThresholds } from '../types';

export const defaultStatusThresholds: StatusThresholds = {
  unsubmittedOverdue: 1,
  counselingOverdue: 3,
  counselingRate: 40,
  excellentRate: 75,
};

export function getCompletionRate(missions: Mission[], studentId: string): number {
  const mine = missions.filter((m) => m.assigneeId === studentId);
  if (mine.length === 0) return 0;
  const done = mine.filter((m) => m.status === 'SUCCESS').length;
  return Math.round((done / mine.length) * 100);
}

export function getWeeklyRate(missions: Mission[], studentId?: string): number {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const week = missions.filter(
    (m) =>
      (!studentId || m.assigneeId === studentId) &&
      new Date(m.createdAt) >= weekStart
  );
  if (week.length === 0) return 0;
  const done = week.filter((m) => m.status === 'SUCCESS').length;
  return Math.round((done / week.length) * 100);
}

export function getOverdueMissions(missions: Mission[], studentId: string): Mission[] {
  const now = new Date();
  return missions.filter(
    (m) =>
      m.assigneeId === studentId &&
      m.status === 'IN_PROGRESS' &&
      new Date(m.endDate) < now
  );
}

export function getStudentStatus(
  missions: Mission[],
  studentId: string,
  thresholds: StatusThresholds = defaultStatusThresholds
): StudentStatus {
  const mine = missions.filter((m) => m.assigneeId === studentId);
  if (mine.length === 0) return 'CAUTION';

  // 미제출(기한이 지났는데 제출 안 함)이 많을수록 상담이 필요한 상태로 판단.
  // 아직 진행 중이거나 검토 대기 중인 미션은 결과가 나오지 않았으므로 평가에서 제외.
  const overdue = getOverdueMissions(missions, studentId).length;
  if (overdue >= thresholds.counselingOverdue) return 'COUNSELING';
  if (overdue >= thresholds.unsubmittedOverdue) return 'UNSUBMITTED';

  const concluded = mine.filter((m) =>
    m.status === 'SUCCESS' || m.status === 'REJECTED' || m.status === 'EXPIRED' || m.status === 'FAILED'
  );
  if (concluded.length === 0) return 'CAUTION';

  const rate = Math.round((concluded.filter((m) => m.status === 'SUCCESS').length / concluded.length) * 100);
  if (rate < thresholds.counselingRate) return 'COUNSELING';
  if (rate >= thresholds.excellentRate) return 'EXCELLENT';
  return 'CAUTION';
}

export const statusConfig: Record<StudentStatus, { label: string; color: string; bg: string }> = {
  EXCELLENT: { label: '우수', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  CAUTION: { label: '주의', color: 'text-amber-700', bg: 'bg-amber-100' },
  UNSUBMITTED: { label: '미제출', color: 'text-orange-700', bg: 'bg-orange-100' },
  COUNSELING: { label: '상담필요', color: 'text-red-700', bg: 'bg-red-100' },
};

export function getStreak(missions: Mission[], studentId: string): number {
  const successes = missions
    .filter((m) => m.assigneeId === studentId && m.status === 'SUCCESS')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (successes.length === 0) return 0;
  // Simple heuristic: each SUCCESS within 3 days of previous = streak
  let streak = 1;
  for (let i = 1; i < successes.length; i++) {
    const diff =
      new Date(successes[i - 1].createdAt).getTime() -
      new Date(successes[i].createdAt).getTime();
    if (diff <= 3 * 86400000) streak++;
    else break;
  }
  return streak;
}

export function getUnsubmittedCount(missions: Mission[], studentId: string): number {
  return getOverdueMissions(missions, studentId).length;
}

export function getWeekRateByOffset(missions: Mission[], studentId: string, weeksAgo: number): number {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - weeksAgo * 7);
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const week = missions.filter(
    (m) => m.assigneeId === studentId && new Date(m.createdAt) >= start && new Date(m.createdAt) <= end
  );
  if (week.length === 0) return -1;
  return Math.round((week.filter((m) => m.status === 'SUCCESS').length / week.length) * 100);
}

export const missionTypeLabel: Record<string, string> = {
  HOMEWORK: '숙제',
  VOCABULARY: '단어암기',
  READING: '독서',
  ATTENDANCE: '출석',
  REVIEW_NOTES: '오답정리',
  LIFESTYLE: '생활습관',
  OTHER: '기타',
};

export const missionGoalLabel: Record<string, string> = {
  SINCERITY: '성실도 향상',
  STUDY_HABIT: '학습 습관 형성',
  SUBMISSION_MGMT: '과제 제출 관리',
  PARENT_REPORT: '학부모 공유용 기록',
  REWARD_EVENT: '보상용 이벤트',
};

export const repeatTypeLabel: Record<string, string> = {
  ONCE: '1회성',
  DAILY: '매일',
  WEEKLY: '매주',
  WEEKDAYS: '평일 반복',
};

export const parentShareLabel: Record<string, string> = {
  NONE: '공유 안 함',
  ON_COMPLETE: '완료 시 공유',
  WEEKLY_REPORT: '주간 리포트에 포함',
};
