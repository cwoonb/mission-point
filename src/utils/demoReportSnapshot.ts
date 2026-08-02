const PREFIX = 'mp-demo-report-';

interface StoredDemoReport {
  expiresAt: string;
  snapshot: unknown;
}

export function saveDemoReportSnapshot(snapshot: unknown, validDays = 7) {
  const token = `demo-${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + validDays * 86400000).toISOString();
  localStorage.setItem(`${PREFIX}${token}`, JSON.stringify({ expiresAt, snapshot } satisfies StoredDemoReport));
  return token;
}

export function getDemoReportSnapshot<T>(token: string): T | null {
  if (!token.startsWith('demo-')) return null;
  try {
    const raw = localStorage.getItem(`${PREFIX}${token}`);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredDemoReport;
    if (Date.parse(stored.expiresAt) <= Date.now()) {
      localStorage.removeItem(`${PREFIX}${token}`);
      return null;
    }
    return stored.snapshot as T;
  } catch {
    localStorage.removeItem(`${PREFIX}${token}`);
    return null;
  }
}

export function revokeDemoReportSnapshot(token: string) {
  localStorage.removeItem(`${PREFIX}${token}`);
}
