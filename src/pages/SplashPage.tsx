import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SplashPage() {
  const navigate = useNavigate();
  return <div className="page-container overflow-hidden bg-[#F8F5F0]"><main className="relative flex min-h-[100dvh] flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
    <div><div className="serif-brand text-[50px] leading-none">M</div><div className="mt-3 flex items-center"><span className="h-px w-14 bg-[#B58A4A]"/><span className="-ml-8 h-2 w-2 rounded-full bg-[#C89B55]"/></div></div>
    <section className="mt-14"><h1 className="serif-brand text-[38px] font-medium leading-[1.35] text-[#14233B]">교육 운영을<br/>더 정교하게</h1><p className="mt-5 text-[15px] leading-7 text-[#687282]">미션 배정부터 제출 확인,<br/>피드백과 활동 기록까지<br/>한곳에서 관리하세요.</p></section>
    <div aria-hidden="true" className="absolute bottom-52 right-5 h-48 w-44 opacity-75"><div className="absolute bottom-0 right-0 h-24 w-20 rounded-t-[45%] border border-[#D8D0C5] bg-[#EEE8DF]"/><span className="absolute bottom-20 right-10 h-28 w-px -rotate-12 bg-[#788166]"/><span className="absolute bottom-32 right-8 h-10 w-5 -rotate-45 rounded-full border border-[#8D9476]"/><span className="absolute bottom-40 right-[62px] h-9 w-4 rotate-45 rounded-full border border-[#8D9476]"/><div className="absolute bottom-0 left-0 h-4 w-28 bg-[#E5DED4] shadow-[0_-8px_0_#F0EBE4]"/></div>
    <section className="relative z-10 mt-auto space-y-2.5"><button type="button" onClick={()=>navigate('/login')} className="min-h-12 w-full rounded-[9px] bg-[#14233B] text-sm font-bold text-white">로그인</button><button type="button" onClick={()=>navigate('/signup')} className="min-h-12 w-full rounded-[9px] border border-[#14233B] bg-[#FFFDFC] text-sm font-bold text-[#14233B]">회원가입</button><button type="button" onClick={()=>navigate('/demo')} className="flex min-h-12 w-full items-center justify-center gap-1 text-sm font-bold text-[#14233B]">데모로 둘러보기<ChevronRight size={16}/></button></section>
  </main></div>;
}
