import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mission } from '../types';

export type AnalyticsPeriod = 'last7' | 'last30' | 'last90' | 'all' | 'custom';

export const ANALYTICS_PERIOD_OPTIONS: Array<{ value: AnalyticsPeriod; label: string; reportLabel: string }> = [
  { value: 'last7', label: '최근 7일', reportLabel: '최근 7일' },
  { value: 'last30', label: '최근 30일', reportLabel: '최근 30일' },
  { value: 'last90', label: '최근 3개월', reportLabel: '최근 3개월' },
  { value: 'all', label: '전체', reportLabel: '누적' },
  { value: 'custom', label: '사용자 지정', reportLabel: '선택 기간' },
];

type AnalyticsPeriodState = {
  selectedPeriod: AnalyticsPeriod;
  defaultPeriod: Exclude<AnalyticsPeriod, 'custom'>;
  customStart: string;
  customEnd: string;
  setSelectedPeriod: (period: AnalyticsPeriod) => void;
  setDefaultPeriod: (period: Exclude<AnalyticsPeriod, 'custom'>) => void;
  setCustomRange: (start: string, end: string) => void;
};

const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const initialEnd = new Date();
const initialStart = new Date();
initialStart.setDate(initialStart.getDate() - 6);

export const useAnalyticsPeriodStore = create<AnalyticsPeriodState>()(
  persist(
    (set) => ({
      selectedPeriod: 'last30',
      defaultPeriod: 'last30',
      customStart: isoDate(initialStart),
      customEnd: isoDate(initialEnd),
      setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
      setDefaultPeriod: (defaultPeriod) => set({ defaultPeriod, selectedPeriod: defaultPeriod }),
      setCustomRange: (customStart, customEnd) => set({ customStart, customEnd, selectedPeriod: 'custom' }),
    }),
    { name: 'mp-analytics-period' }
  )
);

export function getAnalyticsPeriodLabel(period: AnalyticsPeriod) {
  return ANALYTICS_PERIOD_OPTIONS.find((option) => option.value === period)?.reportLabel ?? '선택 기간';
}

export function getAnalyticsPeriodRange(
  period: AnalyticsPeriod,
  customStart: string,
  customEnd: string,
): { start: Date | null; end: Date | null } {
  if (period === 'all') return { start: null, end: null };

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start: Date;

  if (period === 'last7') {
    start = new Date(now);
    start.setDate(start.getDate() - 6);
  } else if (period === 'last30') {
    start = new Date(now);
    start.setDate(start.getDate() - 29);
  } else if (period === 'last90') {
    start = new Date(now);
    start.setDate(start.getDate() - 89);
  } else {
    start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const customEndDate = customEnd ? new Date(`${customEnd}T23:59:59.999`) : end;
    return { start, end: customEndDate };
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export function filterMissionsByAnalyticsPeriod(
  missions: Mission[],
  period: AnalyticsPeriod,
  customStart: string,
  customEnd: string,
) {
  const { start, end } = getAnalyticsPeriodRange(period, customStart, customEnd);
  if (!start || !end) return missions;
  return missions.filter((mission) => {
    return new Date(mission.startDate) <= end && new Date(mission.endDate) >= start;
  });
}
