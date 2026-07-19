import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { googlePayloadToProfile, initNaverLogin, triggerKakaoLogin, triggerNaverLogin } from '../lib/socialAuth';
import { supabase } from '../lib/supabase';
import type { PendingSocialProfile } from '../types';

export default function LoginPage() {
  const navigate=useNavigate();
  const {loginWithEmail,socialLogin}=useAuthStore();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [show,setShow]=useState(false); const [remember,setRemember]=useState(true); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  useEffect(()=>{initNaverLogin().catch(()=>undefined);},[]);
  const social=async(profile:PendingSocialProfile)=>{const result=await socialLogin(profile);navigate(result==='REGISTER'?'/register':'/memberships',{replace:true});};
  const submit=async(event:React.FormEvent)=>{event.preventDefault();if(!email||!password){setError('이메일과 비밀번호를 입력해 주세요.');return;}setLoading(true);const message=await loginWithEmail(email,password);setLoading(false);if(message){setError(message);return;}if(!remember)sessionStorage.setItem('missionapp-session-only','1');navigate('/memberships',{replace:true});};
  const forgot=async()=>{if(!email){setError('이메일 주소를 먼저 입력해 주세요.');return;}const {error:resetError}=await supabase.auth.resetPasswordForEmail(email);setError(resetError?resetError.message:'비밀번호 재설정 메일을 보냈습니다.');};
  return <div className="page-container bg-[#F8F5F0]"><main className="flex min-h-[100dvh] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
    <button type="button" onClick={()=>navigate('/start')} className="w-fit text-left"><div className="serif-brand text-[44px] leading-none">M</div><div className="mt-2 h-px w-10 bg-[#B58A4A]"/></button>
    <section className="mt-12"><h1 className="text-2xl font-bold text-[#14233B]">로그인</h1><p className="mt-2 text-sm text-[#687282]">계정으로 로그인하여 서비스를 이용하세요.</p></section>
    <form onSubmit={submit} className="mt-8 space-y-3"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="이메일 주소" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm outline-none focus:border-[#14233B]"/><div className="relative"><input type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="비밀번호" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 pr-12 text-sm outline-none focus:border-[#14233B]"/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'비밀번호 숨기기':'비밀번호 보기'} className="absolute right-0 top-0 flex h-12 w-12 items-center justify-center text-[#8B929C]">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><div className="flex min-h-11 items-center justify-between text-xs"><label className="flex items-center gap-2 text-[#53606F]"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="h-4 w-4 accent-[#14233B]"/>로그인 상태 유지</label><button type="button" onClick={forgot} className="font-semibold text-[#53606F]">비밀번호 찾기</button></div>{error&&<p role="alert" className="rounded-[8px] bg-[#F7ECEA] px-3 py-2 text-xs text-[#A65F59]">{error}</p>}<button disabled={loading} className="min-h-12 w-full rounded-[9px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50">{loading?'로그인 중':'로그인'}</button></form>
    <div className="my-6 flex items-center gap-3 text-[11px] text-[#9A9FA7]"><span className="h-px flex-1 bg-[#E1DBD3]"/>또는<span className="h-px flex-1 bg-[#E1DBD3]"/></div>
    <div className="space-y-2"><div className="flex justify-center"><GoogleLogin onSuccess={r=>r.credential&&social(googlePayloadToProfile(r.credential))} onError={()=>setError('구글 로그인에 실패했습니다.')} useOneTap={false} shape="rectangular" size="large" text="signin_with" width={310}/></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>{if(!import.meta.env.VITE_KAKAO_REST_KEY){setError('카카오 로그인 환경 설정이 필요합니다.');return;}triggerKakaoLogin().catch(()=>setError('카카오 로그인을 시작하지 못했습니다.'));}} className="min-h-11 rounded-[9px] bg-[#FEE500] text-xs font-bold text-[#191919]">카카오</button><button type="button" onClick={()=>{if(!import.meta.env.VITE_NAVER_CLIENT_ID){setError('네이버 로그인 환경 설정이 필요합니다.');return;}triggerNaverLogin();}} className="min-h-11 rounded-[9px] bg-[#03C75A] text-xs font-bold text-white">네이버</button></div></div>
    <p className="mt-auto pt-8 text-center text-xs text-[#687282]">계정이 없으신가요? <button type="button" onClick={()=>navigate('/signup')} className="font-bold text-[#14233B] underline underline-offset-4">회원가입</button></p>
  </main></div>;
}
