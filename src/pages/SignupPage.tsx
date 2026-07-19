import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function SignupPage(){
  const navigate=useNavigate(); const signup=useAuthStore(s=>s.signupWithEmail);
  const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
  const submit=async(e:React.FormEvent)=>{e.preventDefault();if(!name.trim()||!email||password.length<8){setError('이름, 이메일, 8자 이상 비밀번호를 입력해 주세요.');return;}setLoading(true);const message=await signup(name,email,password);setLoading(false);if(message){setError(message);return;}navigate('/register',{replace:true});};
  return <div className="page-container bg-[#F8F5F0]"><main className="min-h-[100dvh] px-6 pb-8 pt-[max(1rem,env(safe-area-inset-top))]"><button onClick={()=>navigate(-1)} className="flex h-11 w-11 items-center justify-center" aria-label="뒤로 가기"><ChevronLeft size={20}/></button><div className="mt-5 serif-brand text-[42px]">M</div><h1 className="mt-10 text-2xl font-bold text-[#14233B]">회원가입</h1><p className="mt-2 text-sm text-[#687282]">기본 계정을 만든 뒤 소속과 역할을 연결합니다.</p><form onSubmit={submit} className="mt-8 space-y-3"><input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm"/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일 주소" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="비밀번호 8자 이상" className="min-h-12 w-full rounded-[9px] border border-[#E0DAD2] bg-[#FFFDFC] px-4 text-sm"/>{error&&<p role="alert" className="rounded-[8px] bg-[#F7ECEA] px-3 py-2 text-xs text-[#A65F59]">{error}</p>}<button disabled={loading} className="min-h-12 w-full rounded-[9px] bg-[#14233B] text-sm font-bold text-white">{loading?'계정 생성 중':'계정 만들기'}</button></form></main></div>;
}
