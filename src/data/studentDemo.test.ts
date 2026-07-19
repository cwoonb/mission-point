import { describe, expect, it } from 'vitest';
import { buildStudentDemo, STUDENT_DEMO_USER_ID } from './studentDemo';

describe('student demo fixture', () => {
  it('contains eight varied missions for one student', () => {
    const seed = buildStudentDemo();
    expect(seed.missions).toHaveLength(8);
    expect(seed.missions.every((mission) => mission.assigneeId === STUDENT_DEMO_USER_ID)).toBe(true);
    expect(new Set(seed.missions.map((mission) => mission.title)).size).toBe(8);
    expect(new Set(seed.missions.map((mission) => mission.submissionType))).toEqual(new Set(['TEXT', 'IMAGE', 'BOTH']));
  });

  it('covers pending, active, review, rejection, resubmission, and approval', () => {
    const seed = buildStudentDemo();
    expect(new Set(seed.missions.map((mission) => mission.status))).toEqual(new Set(['PENDING', 'IN_PROGRESS', 'REVIEWING', 'REJECTED', 'SUCCESS']));
    expect(seed.submissions.some((submission) => submission.attemptNumber > 1)).toBe(true);
    expect(seed.reviewLogs.some((log) => log.action === 'REJECTED' && !!log.reason)).toBe(true);
    expect(seed.reviewLogs.some((log) => log.action === 'APPROVED' && !!log.reason)).toBe(true);
  });
});
