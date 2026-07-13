import { describe, expect, it } from 'vitest';
import { initialGroups, initialMissions, initialUsers } from '../data/mockData';
import { isDemoUserId } from './demoMode';

describe('demo isolation', () => {
  it('명시적 데모 계정만 데모로 판별한다', () => {
    expect(isDemoUserId('user-teacher-1')).toBe(true);
    expect(isDemoUserId('real-user-id')).toBe(false);
  });

  it('데모는 3개 반, 8명 이상 학생, 승인 대기 3건을 제공한다', () => {
    expect(initialGroups).toHaveLength(3);
    expect(initialUsers.filter((user) => user.role === 'CHILD').length).toBeGreaterThanOrEqual(8);
    expect(initialMissions.filter((mission) => mission.status === 'REVIEWING').length).toBeGreaterThanOrEqual(3);
  });
});
