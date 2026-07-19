import { beforeAll, describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('student demo flow', () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true });
  });

  it('persists a demo submission across restart and resets without API writes', async () => {
    const [{ startStudentDemo }, { useMissionStore }, { STUDENT_DEMO_USER_ID }] = await Promise.all([
      import('./demoSession'),
      import('../store/missionStore'),
      import('./studentDemo'),
    ]);

    startStudentDemo(true);
    const mission = useMissionStore.getState().missions.find((item) => item.title.startsWith('수채화 채색 과정'));
    expect(mission).toBeDefined();

    await useMissionStore.getState().submitMission(mission!.id, STUDENT_DEMO_USER_ID, '데모 글 제출', 'demo-one', ['demo-one','demo-two']);
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('REVIEWING');
    const savedSnapshot = localStorage.getItem('mp-student-demo-state');
    expect(savedSnapshot).toContain('데모 글 제출');

    useMissionStore.setState({ missions: [], submissions: [], reviewLogs: [], demoMode: false });
    localStorage.setItem('mp-student-demo-state', savedSnapshot!);
    startStudentDemo();
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('REVIEWING');
    expect(useMissionStore.getState().submissions.some((item) => item.message === '데모 글 제출')).toBe(true);
    expect(useMissionStore.getState().submissions.find((item) => item.message === '데모 글 제출')?.imageUrls).toHaveLength(2);

    startStudentDemo(true);
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('IN_PROGRESS');
    expect(useMissionStore.getState().submissions.some((item) => item.message === '데모 글 제출')).toBe(false);
  });

  it('keeps demo data organization-scoped and exposes approval feedback to the student', async () => {
    const [{ startStudentDemo }, { useMissionStore }, { STUDENT_DEMO_TEACHER_ID }] = await Promise.all([
      import('./demoSession'),
      import('../store/missionStore'),
      import('./studentDemo'),
    ]);

    startStudentDemo(true);
    const reviewing = useMissionStore.getState().missions.find((mission) => mission.status === 'REVIEWING');
    expect(reviewing?.organizationId).toBe('demo-org-art-student');
    await useMissionStore.getState().approveMission(reviewing!.id, STUDENT_DEMO_TEACHER_ID, '명암 단계가 자연스럽게 연결되었습니다.');
    expect(useMissionStore.getState().getMission(reviewing!.id)?.status).toBe('SUCCESS');
    expect(useMissionStore.getState().getReviewLogs(reviewing!.id)[0]?.reason).toBe('명암 단계가 자연스럽게 연결되었습니다.');
  });
});
