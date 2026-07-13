import { describe, expect, it } from 'vitest';
import type { Mission } from '../types';
import { calculateClassStats, calculateHomeworkStats, getLatestSubmissionByMission, missionsByDisplayStatus } from './missionStats';

const now = new Date('2026-06-06T12:00:00+09:00');
const mission = (id: string, assigneeId: string, status: string, endDate = '2026-06-07T09:00:00+09:00'): Mission => ({
  id, assigneeId, status: status as Mission['status'], endDate,
  title: '수학 문제집', description: '', rewardPoint: 0, creatorId: 'leader', submissionType: 'IMAGE',
  startDate: '2026-06-01T09:00:00+09:00', createdAt: `2026-06-0${id.length}T09:00:00+09:00`,
});

describe('mission statistics', () => {
  it('학생 1명 완료 1명은 100%와 동일한 목록 수를 만든다', () => {
    const missions = [mission('1', 'a', 'SUCCESS')];
    expect(calculateHomeworkStats(missions, now)).toMatchObject({ total: 1, completed: 1, completionRate: 100 });
    expect(missionsByDisplayStatus(missions, 'completed', now)).toHaveLength(1);
  });

  it('완료 1명과 진행 1명은 50%다', () => {
    expect(calculateHomeworkStats([mission('1', 'a', 'SUCCESS'), mission('22', 'b', 'IN_PROGRESS')], now))
      .toMatchObject({ total: 2, completed: 1, inProgress: 1, completionRate: 50 });
  });

  it('승인 대기와 마감 초과 미제출은 완료율 0%다', () => {
    const missions = [mission('1', 'a', 'REVIEWING'), mission('22', 'b', 'IN_PROGRESS', '2026-06-05T09:00:00+09:00')];
    expect(calculateHomeworkStats(missions, now)).toMatchObject({ total: 2, pending: 1, missing: 1, completionRate: 0 });
  });

  it('동일 학생 중복 배정은 최신 미션만 집계한다', () => {
    const missions = [mission('1', 'a', 'IN_PROGRESS'), mission('22', 'a', 'SUCCESS')];
    expect(calculateHomeworkStats(missions, now)).toMatchObject({ total: 1, completed: 1, completionRate: 100 });
  });

  it('배정 학생 0명은 100%로 표시하지 않는다', () => {
    expect(calculateHomeworkStats([], now)).toMatchObject({ total: 0, completionRate: 0 });
  });

  it('반 통계는 학생별 최신 1건이 아니라 모든 학생-숙제 배정을 센다', () => {
    const missions = [
      mission('1', 'a', 'SUCCESS'),
      { ...mission('22', 'a', 'IN_PROGRESS'), title: '영어 단어' },
      { ...mission('333', 'b', 'SUCCESS'), title: '영어 단어' },
    ];
    expect(calculateClassStats(missions, now)).toMatchObject({ total: 3, completed: 2, inProgress: 1, completionRate: 67 });
  });

  it('SUCCESS와 레거시 COMPLETED를 모두 완료로 정규화한다', () => {
    expect(calculateHomeworkStats([mission('1', 'a', 'COMPLETED')], now)).toMatchObject({ completed: 1, completionRate: 100 });
  });

  it('최신 제출 기록만 선택한다', () => {
    const latest = getLatestSubmissionByMission([
      { id: 'old', missionId: 'm', userId: 'a', attemptNumber: 1, submittedAt: '2026-06-05T09:00:00Z' },
      { id: 'new', missionId: 'm', userId: 'a', attemptNumber: 2, submittedAt: '2026-06-06T09:00:00Z' },
    ], 'm');
    expect(latest?.id).toBe('new');
  });
});
