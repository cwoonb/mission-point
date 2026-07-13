import type { Mission } from '../types';

const DATE = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' });
const DATE_TIME = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });

export function formatFriendlyDateTime(value: string): string {
  return DATE_TIME.format(new Date(value)).replace(':00', '시');
}

export function formatMissionPeriod(mission: Pick<Mission, 'startDate' | 'endDate'>): string {
  return `${DATE.format(new Date(mission.startDate))} ~ ${DATE.format(new Date(mission.endDate))}`;
}

export type MissionPeriodStatus = 'upcoming' | 'active' | 'today' | 'urgent' | 'closed' | 'completed';

export function getMissionPeriodStatus(mission: Mission, now = new Date()): MissionPeriodStatus {
  if (mission.status === 'SUCCESS') return 'completed';
  const start = new Date(mission.startDate);
  const end = new Date(mission.endDate);
  if (start > now) return 'upcoming';
  if (end < now) return 'closed';
  const sameDay = end.toDateString() === now.toDateString();
  if (sameDay) return 'today';
  if (end.getTime() - now.getTime() <= 2 * 86400000) return 'urgent';
  return 'active';
}

export const missionPeriodLabel: Record<MissionPeriodStatus, string> = {
  upcoming: '시작 전', active: '진행 중', today: '오늘 마감', urgent: '마감 임박', closed: '마감됨', completed: '완료',
};

export function overlapsPeriod(mission: Mission, start: Date | null, end: Date | null): boolean {
  if (!start || !end) return true;
  return new Date(mission.startDate) <= end && new Date(mission.endDate) >= start;
}
