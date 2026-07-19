import { beforeAll, describe, expect, it, vi } from 'vitest';

const database = vi.hoisted(() => ({ responses: new Map<string, Promise<unknown>>() }));

vi.mock('../lib/supabase', () => ({
  secureBackendEnabled: false,
  supabase: {
    from: (table: string) => ({ select: () => database.responses.get(table) }),
    auth: { signOut: vi.fn() },
  },
}));

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
};

describe('demo initialization race', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true }));

  it('does not let a late operational user response overwrite a demo session', async () => {
    const users = deferred<{ data: unknown[]; error: null }>();
    database.responses.set('users', users.promise);
    const { useAuthStore } = await import('./authStore');
    useAuthStore.setState({ currentUser: null, users: [], isDemoMode: false });
    const loading = useAuthStore.getState().initializeData();
    const demoUser = { id: 'demo-race-leader', name: '데모 운영자', role: 'TEACHER' as const, point: 0, avatar: '데', createdAt: '2026-01-01T00:00:00.000Z' };
    useAuthStore.setState({ currentUser: demoUser, users: [demoUser], isDemoMode: true });
    users.resolve({ data: [{ id: 'real-user' }], error: null });
    await loading;
    expect(useAuthStore.getState().users).toEqual([demoUser]);
  });

  it('does not let late operational mission responses overwrite demo missions', async () => {
    const missions = deferred<{ data: unknown[]; error: null }>();
    const submissions = deferred<{ data: unknown[]; error: null }>();
    const logs = deferred<{ data: unknown[]; error: null }>();
    database.responses.set('missions', missions.promise);
    database.responses.set('mission_submissions', submissions.promise);
    database.responses.set('mission_review_logs', logs.promise);
    const { useMissionStore } = await import('./missionStore');
    useMissionStore.setState({ missions: [], submissions: [], reviewLogs: [], demoMode: false });
    const loading = useMissionStore.getState().initializeData();
    const demoMission = { id: 'demo-race-mission', title: '데모 미션', description: '', rewardPoint: 0, creatorId: 'demo-race-leader', assigneeId: 'demo-race-student', status: 'IN_PROGRESS' as const, submissionType: 'TEXT' as const, startDate: '2026-01-01T00:00:00.000Z', endDate: '2026-01-02T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z' };
    useMissionStore.setState({ missions: [demoMission], demoMode: true });
    missions.resolve({ data: [{ id: 'real-mission' }], error: null });
    submissions.resolve({ data: [], error: null });
    logs.resolve({ data: [], error: null });
    await loading;
    expect(useMissionStore.getState().missions).toEqual([demoMission]);
  });
});
