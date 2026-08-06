import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('visible membership users', () => {
  beforeAll(() => Object.defineProperty(globalThis, 'localStorage', { value: new MemoryStorage(), configurable: true }));
  afterEach(() => vi.restoreAllMocks());

  it('loads only requested profiles and preserves selected membership role', async () => {
    const [{ useAuthStore }, { supabase }] = await Promise.all([import('./authStore'), import('../lib/supabase')]);
    const current: User = { id: 'operator', name: '운영자', role: 'CHILD', point: 0, avatar: '', createdAt: '2026-01-01T00:00:00.000Z', groupId: 'class-a' };
    const rows = [
      { id: 'operator', auth_user_id: 'auth-1', name: '운영자', role: 'TEACHER', point: 0, avatar: '', social_provider: null, social_id: null, email: null, created_at: current.createdAt, group_id: null, facilitator_id: null, code: null, profile_image: null, status_thresholds: null },
      { id: 'student', auth_user_id: 'auth-2', name: '학생', role: 'CHILD', point: 0, avatar: '', social_provider: null, social_id: null, email: null, created_at: current.createdAt, group_id: 'class-a', facilitator_id: 'operator', code: null, profile_image: null, status_thresholds: null },
    ];
    const inQuery = vi.fn().mockResolvedValue({ data: rows, error: null });
    vi.spyOn(supabase, 'from').mockReturnValue({ select: () => ({ in: inQuery }) } as never);
    useAuthStore.setState({ currentUser: current, users: [current], isDemoMode: false });

    await useAuthStore.getState().loadVisibleUsers(['student']);

    expect(inQuery).toHaveBeenCalledWith('id', ['operator', 'student']);
    expect(useAuthStore.getState().users.map((user) => user.id)).toEqual(['operator', 'student']);
    expect(useAuthStore.getState().currentUser?.role).toBe('CHILD');
    expect(useAuthStore.getState().currentUser?.groupId).toBe('class-a');
  });
});
