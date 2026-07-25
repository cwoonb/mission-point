import { describe, expect, it } from 'vitest';
import { authErrorMessage } from './authStore';

describe('auth error messages', () => {
  it('maps common Supabase errors to actionable Korean messages', () => {
    expect(authErrorMessage('Invalid login credentials')).toContain('이메일 또는 비밀번호');
    expect(authErrorMessage('Email not confirmed')).toContain('이메일 인증');
    expect(authErrorMessage('Unsupported provider: provider is not enabled')).toContain('소셜 로그인 설정');
    expect(
      authErrorMessage('For security purposes, you can only request this after 36 seconds.'),
    ).toContain('요청이 너무 많습니다');
  });
});
