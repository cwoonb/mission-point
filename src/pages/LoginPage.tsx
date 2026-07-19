import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { BookOpen, BriefcaseBusiness, Building2, ChevronDown, Dumbbell, HeartHandshake, Home, KeyRound, Palette, PawPrint, Piano, PlayCircle, Stethoscope } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { startDemoScenario, startStudentDemo } from '../data/demoSession';
import { DEMO_SCENARIOS, type DemoScenarioId } from '../data/demoScenarios';
import { googlePayloadToProfile, initNaverLogin, triggerKakaoLogin, triggerNaverLogin } from '../lib/socialAuth';
import type { PendingSocialProfile } from '../types';

const scenarioIcons: Record<DemoScenarioId, typeof Building2> = { 'large-academy': Building2, 'study-room': Home, 'pt-center': Dumbbell, family: HeartHandshake, piano: Piano, art: Palette, movement: BookOpen, company: BriefcaseBusiness, rehab: Stethoscope, 'pet-care': PawPrint };

export default function LoginPage() {
  const navigate = useNavigate();
  const socialLogin = useAuthStore((state) => state.socialLogin);
  const [loginOpen, setLoginOpen] = useState(false);
  const [studentOpen, setStudentOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { initNaverLogin().catch(() => undefined); }, []);

  const handleSocialProfile = async (profile: PendingSocialProfile) => { const result = await socialLogin(profile); navigate(result === 'REGISTER' ? '/register' : '/', { replace: true }); };
  const kakao = async () => { if (!import.meta.env.VITE_KAKAO_REST_KEY) { setError('카카오 로그인 환경 설정이 필요합니다.'); return; } setLoading('KAKAO'); try { await triggerKakaoLogin(); } catch { setLoading(null); setError('카카오 로그인을 시작하지 못했습니다.'); } };
  const naver = () => { if (!import.meta.env.VITE_NAVER_CLIENT_ID) { setError('네이버 로그인 환경 설정이 필요합니다.'); return; } setLoading('NAVER'); triggerNaverLogin(); };
  const beginStudentDemo = () => { startStudentDemo(); navigate('/', { replace: true }); };

  const SocialPanel = () => <div className="mt-3 space-y-2 rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><p className="mb-3 text-center text-xs text-[#687282]">로그인 후 초대 코드 또는 초대 링크로 연결할 수 있습니다.</p>{error && <p role="alert" className="rounded-[9px] bg-[#F8EAE8] px-3 py-2 text-center text-xs text-[#A2504C]">{error}</p>}<div className="flex justify-center"><GoogleLogin onSuccess={(response) => response.credential && handleSocialProfile(googlePayloadToProfile(response.credential))} onError={() => setError('구글 로그인에 실패했습니다.')} useOneTap={false} shape="rectangular" size="large" text="signin_with" width={280}/></div><button type="button" onClick={kakao} disabled={loading === 'KAKAO'} className="min-h-11 w-full rounded-[10px] bg-[#FEE500] text-sm font-bold text-[#191919] disabled:opacity-50">카카오로 로그인</button><button type="button" onClick={naver} disabled={loading === 'NAVER'} className="min-h-11 w-full rounded-[10px] bg-[#03C75A] text-sm font-bold text-white disabled:opacity-50">네이버로 로그인</button></div>;

  return <div className="page-container overflow-y-auto bg-[#F8F5F0]"><main className="flex min-h-full flex-col px-6 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
    <section className="relative flex min-h-[390px] flex-col"><div className="serif-brand text-[52px] leading-none">M</div><div className="mt-3 h-px w-14 bg-[#B58A4A]"/><div className="mt-14 max-w-[305px]"><h1 className="serif-brand text-[38px] font-medium leading-[1.35]">교육 운영을<br/>더 정교하게</h1><p className="mt-5 text-[15px] leading-7 text-[#687282]">미션 배정부터 제출 확인, 피드백과 활동 기록까지 한곳에서 관리하세요.</p></div><div aria-hidden="true" className="absolute bottom-3 right-1 h-28 w-36 opacity-70"><div className="absolute bottom-0 right-0 h-16 w-14 rounded-t-[42%] border border-[#D8D0C5] bg-[#EEE8DF]"/><div className="absolute bottom-4 right-10 h-20 w-px -rotate-6 bg-[#7D8667]"/></div></section>
    <section className="relative z-10 mt-auto space-y-2.5">
      <button type="button" onClick={() => { setLoginOpen((value) => !value); setStudentOpen(false); }} className="min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white">운영자로 시작하기</button>
      <AnimatePresence>{loginOpen && <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden"><SocialPanel/></motion.div>}</AnimatePresence>
      <button type="button" onClick={() => { setStudentOpen((value) => !value); setLoginOpen(false); }} className="min-h-12 w-full rounded-[10px] border border-[#14233B] text-sm font-bold text-[#14233B]">학생으로 참여하기</button>
      <AnimatePresence>{studentOpen && <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden"><div className="mt-2 grid gap-2 rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-3"><button type="button" onClick={() => setLoginOpen(true)} className="flex min-h-14 items-center gap-3 rounded-[10px] border border-[#E7E1D9] px-4 text-left"><KeyRound size={19} className="text-[#B58A4A]"/><span><strong className="block text-sm text-[#14233B]">초대 코드로 참여하기</strong><span className="text-[11px] text-[#687282]">로그인 후 선생님 코드 연결</span></span></button><button type="button" onClick={beginStudentDemo} className="flex min-h-14 items-center gap-3 rounded-[10px] bg-[#14233B] px-4 text-left text-white"><PlayCircle size={19}/><span><strong className="block text-sm">학생 데모 체험하기</strong><span className="text-[11px] text-white/70">가입 없이 전체 학생 흐름 체험</span></span></button></div>{loginOpen && <SocialPanel/>}</motion.div>}</AnimatePresence>
      <button type="button" onClick={() => setDemoOpen((value) => !value)} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 text-sm font-semibold text-[#14233B]">운영자 데모 선택 <ChevronDown size={16} className={demoOpen?'rotate-180':''}/></button>
      <AnimatePresence>{demoOpen && <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}} className="overflow-hidden"><div className="grid grid-cols-2 gap-2 pt-2">{DEMO_SCENARIOS.map((scenario) => { const Icon=scenarioIcons[scenario.id]; return <button type="button" key={scenario.id} onClick={() => { startDemoScenario(scenario.id); navigate('/',{replace:true}); }} className="min-h-28 rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left"><Icon size={20} className="text-[#B58A4A]"/><p className="mt-2 text-xs font-bold text-[#14233B]">{scenario.name}</p><p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-[#687282]">{scenario.description}</p></button>;})}</div></motion.div>}</AnimatePresence>
      <p className="pt-4 text-center text-[10px] leading-5 text-[#9299A3]">로그인하면 서비스 이용약관 및 개인정보처리방침에 동의합니다.</p>
    </section>
  </main></div>;
}
