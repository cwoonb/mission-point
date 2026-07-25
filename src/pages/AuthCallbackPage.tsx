import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

const allowedNext = new Set(['/register', '/memberships', '/reset-password', '/']);

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initializeData = useAuthStore((state) => state.initializeData);
  const [error, setError] = useState('');
  const code = params.get('code');
  const requestedNext = params.get('next') ?? '/memberships';

  useEffect(() => {
    let active = true;
    void (async () => {
      const next = allowedNext.has(requestedNext) ? requestedNext : '/memberships';
      const existing = await supabase.auth.getSession();
      if (existing.error) {
        if (active) setError('로그인 세션을 확인하지 못했습니다. 다시 로그인해 주세요.');
        return;
      }
      if (!existing.data.session && code) {
        const exchanged = await supabase.auth.exchangeCodeForSession(code);
        if (exchanged.error) {
          if (active) setError('로그인 인증이 만료되었거나 이미 사용되었습니다. 다시 로그인해 주세요.');
          return;
        }
      } else if (!existing.data.session) {
        if (active) setError('로그인 인증 정보가 없습니다. 다시 로그인해 주세요.');
        return;
      }
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
  }, [code, initializeData, navigate, requestedNext]);

  return <div className="page-container flex min-h-[100dvh] items-center justify-center bg-[#F8F5F0] px-6 text-center">{error ? <div><h1 className="text-lg font-bold text-[#14233B]">로그인을 완료하지 못했습니다.</h1><p role="alert" className="mt-3 text-sm leading-6 text-[#A65F59]">{error}</p><button onClick={() => navigate('/login', { replace: true })} className="mt-6 min-h-12 rounded-[9px] bg-[#14233B] px-6 text-sm font-bold text-white">로그인으로 돌아가기</button></div> : <p role="status" className="text-sm font-semibold text-[#687282]">로그인을 완료하는 중...</p>}</div>;
}
