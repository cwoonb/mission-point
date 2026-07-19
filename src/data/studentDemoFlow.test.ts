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
    const mission = useMissionStore.getState().missions.find((item) => item.title === '수채화 채색 과정');
    expect(mission).toBeDefined();

    await useMissionStore.getState().submitMission(mission!.id, STUDENT_DEMO_USER_ID, '데모 글 제출', undefined);
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('REVIEWING');
    const savedSnapshot = localStorage.getItem('mp-student-demo-state');
    expect(savedSnapshot).toContain('데모 글 제출');

    useMissionStore.setState({ missions: [], submissions: [], reviewLogs: [], demoMode: false });
    localStorage.setItem('mp-student-demo-state', savedSnapshot!);
    startStudentDemo();
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('REVIEWING');
    expect(useMissionStore.getState().submissions.some((item) => item.message === '데모 글 제출')).toBe(true);

    startStudentDemo(true);
    expect(useMissionStore.getState().missions.find((item) => item.id === mission!.id)?.status).toBe('IN_PROGRESS');
    expect(useMissionStore.getState().submissions.some((item) => item.message === '데모 글 제출')).toBe(false);
  });
});
