import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const allowedNext = new Set(['/register', '/memberships', '/reset-password', '/']);
const exchangeTasks = new Map<string, ReturnType<typeof supabase.auth.exchangeCodeForSession>>();
const reportedCallbackErrors = new Set<string>();
const KAKAO_LOGIN_ERROR = '카카오 로그인 설정을 확인하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';

function exchangeCodeOnce(code: string) {
  const existing = exchangeTasks.get(code);
  if (existing) return existing;
  const task = supabase.auth.exchangeCodeForSession(code);
  exchangeTasks.set(code, task);
  void task.finally(() => {
    window.setTimeout(() => exchangeTasks.delete(code), 0);
  });
  return task;
}

function logCallbackError(
  provider: string | null,
  code: string,
  message: string,
) {
  if (!import.meta.env.DEV) return;
  const key = `${provider ?? 'unknown'}:${code}:${window.location.pathname}`;
  if (reportedCallbackErrors.has(key)) return;
  reportedCallbackErrors.add(key);
  console.error('OAuth callback failed', {
    provider: provider ?? 'unknown',
    code,
    message,
    redirectTo: `${window.location.origin}/auth/callback`,
    pathname: window.location.pathname,
  });
}

function cleanCallbackUrl(next: string, provider: string | null) {
  const cleanUrl = new URL('/auth/callback', window.location.origin);
  cleanUrl.searchParams.set('next', next);
  if (provider === 'kakao') cleanUrl.searchParams.set('provider', provider);
  window.history.replaceState(null, '', cleanUrl);
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initializeData = useAuthStore((state) => state.initializeData);
  const [error, setError] = useState('');
  const code = params.get('code');
  const requestedNext = params.get('next') ?? '/memberships';
  const provider = params.get('provider');
  const oauthErrorCode = params.get('error_code') ?? params.get('error');
  const oauthErrorDescription = params.get('error_description');

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = allowedNext.has(requestedNext) ? requestedNext : '/memberships';
      if (oauthErrorCode) {
        cleanCallbackUrl(next, provider);
        logCallbackError(
          provider,
          oauthErrorCode,
          oauthErrorDescription ?? 'OAuth callback failed',
        );
        if (active) setError(provider === 'kakao' ? KAKAO_LOGIN_ERROR : '로그인 인증을 완료하지 못했습니다. 다시 시도해 주세요.');
        return;
      }
      const existing = await supabase.auth.getSession();
      if (existing.error) {
        cleanCallbackUrl(next, provider);
        if (active) setError('로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.');
        return;
      }
      if (!existing.data.session && code) {
        const exchanged = await exchangeCodeOnce(code);
        if (exchanged.error) {
          cleanCallbackUrl(next, provider);
          if (provider === 'kakao') {
            logCallbackError(
              provider,
              exchanged.error.code ?? 'unknown',
              exchanged.error.message,
            );
          }
          if (active) setError(provider === 'kakao' ? KAKAO_LOGIN_ERROR : '로그인 인증이 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.');
          return;
        }
      } else if (!existing.data.session) {
        cleanCallbackUrl(next, provider);
        if (active) setError('로그인 인증 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }
      cleanCallbackUrl(next, provider);
      useAuthStore.setState({ authInitialized: false });
      await initializeData();
      if (!active) return;
      if (!useAuthStore.getState().currentUser) {
        setError('계정 정보를 연결하지 못했습니다. 다시 로그인해 주세요.');
        return;
      }
      navigate(next, { replace: true });
    })();
    return () => { active = false; };
  }, [code, initializeData, navigate, oauthErrorCode, oauthErrorDescription, provider, requestedNext]);

  return <div className="page-container flex min-h-[100dvh] items-center justify-center bg-[#F8F5F0] px-6 text-center">{error ? <div><h1 className="text-lg font-bold text-[#14233B]">로그인을 완료하지 못했습니다.</h1><p role="alert" className="mt-3 text-sm leading-6 text-[#A65F59]">{error}</p><button onClick={() => navigate('/login', { replace: true })} className="mt-6 min-h-12 rounded-[9px] bg-[#14233B] px-6 text-sm font-bold text-white">로그인으로 돌아가기</button></div> : <p role="status" className="text-sm font-semibold text-[#687282]">로그인을 완료하는 중...</p>}</div>;
}
