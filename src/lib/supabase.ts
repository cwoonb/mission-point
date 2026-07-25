import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    persistSession: true,
  },
});
export const secureBackendEnabled = import.meta.env.VITE_SECURE_BACKEND_ENABLED === 'true';

export const authRedirectUrl = (next = '/memberships') => {
  const url = new URL('/auth/callback', window.location.origin);
  url.searchParams.set('next', next.startsWith('/') ? next : '/memberships');
  return url.toString();
};

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
