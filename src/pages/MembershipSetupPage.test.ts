import { describe, expect, it } from 'vitest';
import { organizationSetupErrorMessage } from './MembershipSetupPage';

describe('organization setup errors', () => {
  it('does not mislabel an auth failure as a network error', () => {
    expect(organizationSetupErrorMessage(new Error('AUTH_REQUIRED'), 'create')).toContain('다시 로그인');
  });

  it('keeps join failures actionable', () => {
    expect(organizationSetupErrorMessage(new Error('INVITE_NOT_FOUND'), 'join')).toContain('초대 코드');
  });
});
