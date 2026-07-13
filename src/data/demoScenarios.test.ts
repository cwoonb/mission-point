import { describe, expect, it } from 'vitest';
import { buildDemoScenario, DEMO_SCENARIOS } from './demoScenarios';

describe('demo scenario fixtures', () => {
  it.each(DEMO_SCENARIOS)('$name 데이터를 설정값대로 격리 생성한다', (config) => {
    const seed = buildDemoScenario(config.id);
    const members = seed.users.filter((user) => user.role === 'CHILD');
    const ids = [
      ...seed.users.map((item) => item.id),
      ...seed.groups.map((item) => item.id),
      ...seed.missions.map((item) => item.id),
      ...seed.submissions.map((item) => item.id),
      ...seed.reviewLogs.map((item) => item.id),
    ];

    expect(members).toHaveLength(config.memberCount);
    expect(seed.missions).toHaveLength(config.missionCount);
    expect(seed.stats.feedbacks).toBe(config.feedbackCount);
    expect(seed.stats.notes).toBe(config.noteCount);
    expect(seed.stats.photos).toBe(config.photoCount);
    expect(seed.stats.reports).toBe(config.memberCount);
    expect(ids.every((id) => id.startsWith('demo-'))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(seed.missions.map((mission) => mission.status)).size).toBeGreaterThanOrEqual(4);
    expect(members.every((member) => seed.missions.some((mission) => mission.assigneeId === member.id))).toBe(true);
    expect(seed.submissions.every((submission) => seed.missions.some((mission) => mission.id === submission.missionId))).toBe(true);
  });

  it('대형 학원은 실제 운영 규모 기준을 충족한다', () => {
    const { stats } = buildDemoScenario('large-academy');
    expect(stats.members).toBeGreaterThanOrEqual(70);
    expect(stats.missions).toBeGreaterThanOrEqual(150);
    expect(stats.pending).toBeGreaterThanOrEqual(20);
    expect(stats.missing).toBeGreaterThanOrEqual(10);
    expect(stats.completed).toBeGreaterThanOrEqual(100);
    expect(stats.notes).toBeGreaterThanOrEqual(50);
    expect(stats.photos).toBeGreaterThanOrEqual(100);
  });
});
