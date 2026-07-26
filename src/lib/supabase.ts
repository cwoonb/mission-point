import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    // /auth/callback performs the PKCE exchange explicitly. Keeping automatic
    // detection enabled can race the callback page and consume the code twice.
    detectSessionInUrl: false,
    flowType: 'pkce',
    persistSession: true,
  },
});
export const secureBackendEnabled = import.meta.env.VITE_SECURE_BACKEND_ENABLED === 'true';

export const authRedirectUrl = (
  next = '/memberships',
  provider?: 'kakao',
  origin = window.location.origin,
) => {
  const callbackUrl = new URL('/auth/callback', origin);
  callbackUrl.searchParams.set('next', next.startsWith('/') ? next : '/memberships');
  if (provider) callbackUrl.searchParams.set('provider', provider);
  return callbackUrl.toString();
};

export const kakaoOAuthOptions = (origin = window.location.origin) => ({
  // Supabase owns client credentials and provider scopes. Do not add scopes here.
  redirectTo: authRedirectUrl('/memberships', 'kakao', origin),
});

export async function isAuthProviderEnabled(provider: 'google' | 'kakao') {
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anonKey } });
    if (!response.ok) return false;
    const settings = await response.json() as { external?: Record<string, boolean> };
    return settings.external?.[provider] === true;
  } catch {
    return false;
  }
}
