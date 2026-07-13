import { describe, expect, it } from 'vitest';
import type { Mission } from '../types';
import { getMissionPeriodStatus, overlapsPeriod } from './missionDates';

const mission = { startDate: '2026-07-10T09:00:00+09:00', endDate: '2026-07-15T18:00:00+09:00', status: 'IN_PROGRESS' } as Mission;

describe('mission period lookup', () => {
  it('기간이 겹치는 미션만 최근 조회에 포함한다', () => {
    expect(overlapsPeriod(mission, new Date('2026-07-01'), new Date('2026-07-31'))).toBe(true);
    expect(overlapsPeriod(mission, new Date('2026-06-01'), new Date('2026-06-30'))).toBe(false);
  });

  it('시작 전과 진행 중 상태를 기간으로 구분한다', () => {
    expect(getMissionPeriodStatus(mission, new Date('2026-07-09'))).toBe('upcoming');
    expect(getMissionPeriodStatus(mission, new Date('2026-07-12'))).toBe('active');
  });
});
