import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { googlePayloadToProfile, triggerKakaoLogin, initNaverLogin, triggerNaverLogin } from '../lib/socialAuth';
import type { PendingSocialProfile } from '../types';

export default function LoginPage() {
  const navigate = useNavigate();
  const { socialLogin, login, users } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    // Pre-load Naver SDK so the login button is ready
    initNaverLogin().catch(() => {/* ignore if env not set */});
  }, []);

  const handleSocialProfile = (profile: PendingSocialProfile) => {
    const result = socialLogin(profile);
    if (result === 'REGISTER') {
      navigate('/register', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  const handleKakaoLogin = () => {
    const appKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!appKey) {
      setError('카카오 앱 키가 설정되지 않았습니다.');
      return;
    }
    try {
      triggerKakaoLogin();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`카카오 로그인 실패: ${msg}`);
    }
  };

  const handleNaverLogin = () => {
    const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
    if (!clientId) {
      setError('네이버 클라이언트 ID가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
      return;
    }
    setLoading('NAVER');
    triggerNaverLogin();
    // Result comes via URL hash redirect — handled in App.tsx
  };

  const demoUsers = users.filter((u) => !u.socialProvider);

  return (
    <div className="page-container min-h-screen flex flex-col bg-white overflow-hidden">
      {/* 상단 배경 */}
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 rounded-b-[3rem] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col px-6">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-16 pb-8 text-center"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-[1.8rem] flex items-center justify-center text-5xl shadow-2xl mx-auto mb-5 border border-white/30">
            🎯
          </div>
          <h1 className="text-3xl font-black text-white mb-2">미션 포인트</h1>
          <p className="text-white/70 text-sm">미션을 완료하고 포인트를 모아요!</p>
        </motion.div>

        {/* 로그인 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col gap-4 mb-4"
        >
          <div className="text-center mb-1">
            <h2 className="text-lg font-black text-gray-800">로그인</h2>
            <p className="text-gray-400 text-xs mt-0.5">소셜 계정으로 간편하게 시작하세요</p>
          </div>

          {/* 오류 메시지 */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-600 text-xs text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google 로그인 */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={(res) => {
                if (!res.credential) return;
                setError(null);
                const profile = googlePayloadToProfile(res.credential);
                handleSocialProfile(profile);
              }}
              onError={() => setError('구글 로그인에 실패했습니다.')}
              useOneTap={false}
              shape="pill"
              size="large"
              text="signin_with"
              width={280}
            />
          </div>

          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            disabled={loading === 'KAKAO'}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#FEE500', color: '#191919' }}
          >
            {loading === 'KAKAO' ? (
              <span className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 2C5.582 2 2 4.805 2 8.244c0 2.227 1.377 4.179 3.46 5.318l-.88 3.26c-.077.286.252.517.502.35l3.827-2.542c.36.047.726.074 1.091.074 4.418 0 8-2.805 8-6.26C18 4.805 14.418 2 10 2z"
                  fill="#191919"
                />
              </svg>
            )}
            카카오로 로그인
          </button>

          {/* 네이버 로그인 */}
          <button
            onClick={handleNaverLogin}
            disabled={loading === 'NAVER'}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm text-white transition-all active:scale-95 disabled:opacity-60"
            style={{ backgroundColor: '#03C75A' }}
          >
            {loading === 'NAVER' ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
                  fill="white"
                />
              </svg>
            )}
            네이버로 로그인
          </button>
        </motion.div>

        {/* 데모 계정 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-md overflow-hidden mb-6"
        >
          <button
            onClick={() => setShowDemo((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-gray-600"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🎮</span>
              <div className="text-left">
                <p className="font-bold text-sm text-gray-700">데모 체험하기</p>
                <p className="text-xs text-gray-400">API 키 없이 샘플 계정으로 체험</p>
              </div>
            </div>
            {showDemo ? (
              <ChevronUp size={16} className="text-gray-400" />
            ) : (
              <ChevronDown size={16} className="text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showDemo && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-gray-100 px-4 pb-4 pt-3 grid gap-2">
                  {demoUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => { login(user.id); navigate('/', { replace: true }); }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 hover:bg-purple-50 active:scale-98 transition-all text-left"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-400">
                          {user.role === 'CHILD' ? '수행자' : '진행자'} · {user.point.toLocaleString()}P
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-center text-xs text-gray-400 pb-6">
          로그인 시 서비스 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </div>
  );
}
