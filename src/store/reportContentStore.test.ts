import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';
import { useMembershipStore } from './membershipStore';
import { useReportContentStore } from './reportContentStore';

describe('report teacher content', () => {
  beforeEach(() => {
    useAuthStore.setState({ isDemoMode: true });
    useMembershipStore.setState({
      activeMembershipId: 'demo-membership-test',
      memberships: [{ id: 'demo-membership-test', userId: 'teacher', organizationId: 'demo-org-test', role: 'TEACHER', status: 'ACTIVE', createdAt: new Date().toISOString() }],
    });
    useReportContentStore.setState({ contents: {}, loadedKeys: [] });
  });

  it('saves, edits, and clears a public memo without using counseling notes', async () => {
    await useReportContentStore.getState().saveMemo('demo-org-test', 'student', '  보호자에게 공개할 메모  ');
    expect(useReportContentStore.getState().getMemo('demo-org-test', 'student')).toBe('보호자에게 공개할 메모');
    await useReportContentStore.getState().saveMemo('demo-org-test', 'student', '수정한 메모');
    expect(useReportContentStore.getState().getMemo('demo-org-test', 'student')).toBe('수정한 메모');
    await useReportContentStore.getState().saveMemo('demo-org-test', 'student', '');
    expect(useReportContentStore.getState().getMemo('demo-org-test', 'student')).toBe('');
    expect(useAuthStore.getState().teacherNotes).toEqual({});
  });

  it('blocks a student membership from editing', async () => {
    useMembershipStore.setState({
      activeMembershipId: 'demo-membership-student',
      memberships: [{ id: 'demo-membership-student', userId: 'student', organizationId: 'demo-org-test', role: 'STUDENT', status: 'ACTIVE', createdAt: new Date().toISOString() }],
    });
    await expect(useReportContentStore.getState().saveMemo('demo-org-test', 'student', '금지')).rejects.toThrow('REPORT_FORBIDDEN');
  });
});
