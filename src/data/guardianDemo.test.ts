import { describe, expect, it } from 'vitest';
import { buildDemoScenario } from './demoScenarios';
import { buildGuardianDemo, GUARDIAN_DEMO_USER_ID } from './guardianDemo';

describe('guardian demo fixture', () => {
  it('links one guardian to multiple students with report history', () => {
    const demo = buildGuardianDemo(buildDemoScenario('study-room'), 'demo-org-study-room');
    expect(demo.currentUser.id).toBe(GUARDIAN_DEMO_USER_ID);
    expect(demo.links).toHaveLength(2);
    expect(new Set(demo.links.map((link) => link.studentId)).size).toBe(2);
    expect(demo.reports).toHaveLength(4);
    expect(demo.reports.every((report) => report.snapshot.feedback && report.snapshot.teacherMemo)).toBe(true);
  });
});
