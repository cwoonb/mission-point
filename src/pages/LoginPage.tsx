import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { BookOpen, BriefcaseBusiness, Building2, ChevronDown, Dumbbell, HeartHandshake, Home, Palette, PawPrint, Piano, Stethoscope } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { startDemoScenario } from '../data/demoSession';
import { DEMO_SCENARIOS, type DemoScenarioId } from '../data/demoScenarios';
import { googlePayloadToProfile, initNaverLogin, triggerKakaoLogin, triggerNaverLogin } from '../lib/socialAuth';
import type { PendingSocialProfile } from '../types';

const scenarioIcons: Record<DemoScenarioId, typeof Building2> = {
  'large-academy': Building2, 'study-room': Home, 'pt-center': Dumbbell, family: HeartHandshake,
  piano: Piano, art: Palette, movement: BookOpen, company: BriefcaseBusiness, rehab: Stethoscope, 'pet-care': PawPrint,
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { socialLogin } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => { initNaverLogin().catch(() => undefined); }, []);

  const handleSocialProfile = async (profile: PendingSocialProfile) => {
    const result = await socialLogin(profile);
    navigate(result === 'REGISTER' ? '/register' : '/', { replace: true });
  };
  const handleKakaoLogin = async () => {
    if (!import.meta.env.VITE_KAKAO_REST_KEY) { setError('카카오 로그인을 위한 환경 설정이 필요합니다.'); return; }
    setLoading('KAKAO'); setError(null);
    try { await triggerKakaoLogin(); } catch (reason) { setLoading(null); setError(reason instanceof Error ? reason.message : '카카오 로그인에 실패했습니다.'); }
  };
  const handleNaverLogin = () => {
    if (!import.meta.env.VITE_NAVER_CLIENT_ID) { setError('네이버 로그인을 위한 환경 설정이 필요합니다.'); return; }
    setLoading('NAVER'); setError(null); triggerNaverLogin();
  };

  return (
    <div className="page-container overflow-y-auto bg-[#F8F5F0]">
      <main className="flex min-h-full flex-col px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
        <section className="relative flex min-h-[410px] flex-col">
          <div className="serif-brand text-[52px] leading-none">M</div>
          <div className="mt-3 h-px w-14 bg-[#B58A4A]" />
          <div className="mt-16 max-w-[300px]">
            <h1 className="serif-brand text-[38px] font-medium leading-[1.35]">교육 운영을<br />더 정교하게</h1>
            <p className="mt-5 text-[15px] leading-7 text-[#687282]">숙제 배정부터 제출 확인, 피드백과 학부모 리포트까지 모든 과정을 한곳에서 관리하세요.</p>
          </div>
          <div aria-hidden="true" className="absolute bottom-0 right-0 h-36 w-40 opacity-80">
            <div className="absolute bottom-2 right-2 h-20 w-16 rounded-t-[42%] border border-[#D8D0C5] bg-[#EEE8DF]" />
            <div className="absolute bottom-6 right-[46px] h-24 w-px rotate-[-8deg] bg-[#7D8667]" />
            <div className="absolute bottom-[82px] right-[41px] h-6 w-3 rotate-[-38deg] rounded-[100%_0] border border-[#7D8667]" />
            <div className="absolute bottom-[62px] right-[54px] h-6 w-3 rotate-[42deg] rounded-[0_100%] border border-[#7D8667]" />
            <div className="absolute bottom-0 right-20 h-2 w-24 border border-[#D8D0C5] bg-[#FFFDFC]" />
            <div className="absolute bottom-3 right-[78px] h-2 w-20 border border-[#D8D0C5] bg-[#F3EFE9]" />
          </div>
        </section>

        <section className="relative z-10 mt-auto space-y-2.5">
          <button onClick={() => setShowLogin(true)} className="flex min-h-12 w-full items-center justify-center rounded-[10px] bg-[#14233B] px-5 text-sm font-bold text-white hover:bg-[#0D192B]">운영자로 시작하기</button>
          <button onClick={() => setShowLogin(true)} className="flex min-h-12 w-full items-center justify-center rounded-[10px] border border-[#14233B] px-5 text-sm font-bold text-[#14233B] hover:bg-[#E9EDF2]">학생으로 참여하기</button>
          <AnimatePresence>
            {showLogin && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="mt-3 space-y-2 rounded-2xl border border-[#E7E1D9] bg-[#FFFDFC] p-4">
                <p className="mb-3 text-center text-xs font-medium text-[#687282]">소셜 계정으로 안전하게 계속하세요</p>
                {error && <p role="alert" className="rounded-[10px] bg-[#F8EAE8] px-3 py-2 text-center text-xs text-[#A2504C]">{error}</p>}
                <div className="flex justify-center"><GoogleLogin onSuccess={(res) => { if (res.credential) handleSocialProfile(googlePayloadToProfile(res.credential)); }} onError={() => setError('구글 로그인에 실패했습니다.')} useOneTap={false} shape="rectangular" size="large" text="signin_with" width={280} /></div>
                <button onClick={handleKakaoLogin} disabled={loading === 'KAKAO'} className="flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#FEE500] text-sm font-bold text-[#191919] disabled:opacity-50">카카오로 로그인</button>
                <button onClick={handleNaverLogin} disabled={loading === 'NAVER'} className="flex min-h-11 w-full items-center justify-center rounded-[10px] bg-[#03C75A] text-sm font-bold text-white disabled:opacity-50">네이버로 로그인</button>
              </div>
            </motion.div>}
          </AnimatePresence>

          <button onClick={() => setShowDemo((value) => !value)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#14233B]">데모 체험하기 <ChevronDown size={16} className={showDemo ? 'rotate-180' : ''} /></button>
          <AnimatePresence>
            {showDemo && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-2 pt-2">
                {DEMO_SCENARIOS.map((scenario) => { const Icon = scenarioIcons[scenario.id]; return <button key={scenario.id} onClick={() => { startDemoScenario(scenario.id); navigate('/', { replace: true }); }} className="min-h-28 rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left hover:border-[#B58A4A]">
                  <Icon size={20} className="text-[#B58A4A]" /><p className="mt-2 text-xs font-bold text-[#14233B]">{scenario.name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#687282]">{scenario.description}</p>
                </button>; })}
              </div>
            </motion.div>}
          </AnimatePresence>
          <p className="pt-4 text-center text-[10px] leading-5 text-[#9299A3]">로그인하면 서비스 이용약관 및 개인정보처리방침에 동의합니다.</p>
        </section>
      </main>
    </div>
  );
}
