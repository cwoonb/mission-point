import { describe, expect, it } from 'vitest';
import { authRedirectUrl, kakaoOAuthOptions } from './supabase';

describe('Supabase OAuth configuration', () => {
  it('builds the production callback without provider secrets', () => {
    const redirectTo = authRedirectUrl(
      '/memberships',
      'kakao',
      'https://missionapp-topaz.vercel.app',
    );
    const callback = new URL(redirectTo);

    expect(callback.origin).toBe('https://missionapp-topaz.vercel.app');
    expect(callback.pathname).toBe('/auth/callback');
    expect(callback.searchParams.get('next')).toBe('/memberships');
    expect(callback.searchParams.get('provider')).toBe('kakao');
  });

  it('does not add custom Kakao scopes or credentials', () => {
    const options = kakaoOAuthOptions('http://localhost:3001');

    expect(Object.keys(options)).toEqual(['redirectTo']);
    expect(options).not.toHaveProperty('scopes');
    expect(options).not.toHaveProperty('queryParams');
    expect(options.redirectTo).toBe(
      'http://localhost:3001/auth/callback?next=%2Fmemberships&provider=kakao',
    );
  });

  it('keeps the existing Google redirect URL shape', () => {
    expect(authRedirectUrl('/memberships', undefined, 'https://missionapp-topaz.vercel.app'))
      .toBe('https://missionapp-topaz.vercel.app/auth/callback?next=%2Fmemberships');
  });
});
