import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getDemoReportSnapshot, saveDemoReportSnapshot } from './demoReportSnapshot';

describe('demo report snapshot', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('stores a browser-only snapshot without backend data', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'report-token' });
    const token = saveDemoReportSnapshot({ teacherMemo: '공개 메모' });
    expect(token).toBe('demo-report-token');
    expect(getDemoReportSnapshot<{ teacherMemo: string }>(token)?.teacherMemo).toBe('공개 메모');
  });
});
