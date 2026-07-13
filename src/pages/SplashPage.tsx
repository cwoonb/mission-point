import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { initializeData: initAuth, currentUser } = useAuthStore();
  const { initializeData: initMissions } = useMissionStore();

  useEffect(() => {
    (async () => {
      await initAuth();
      await initMissions();
    })();

    const timer = setTimeout(() => {
      navigate(currentUser ? '/' : '/login', { replace: true });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container min-h-screen items-center justify-center overflow-hidden bg-[#F8F5F0]">
      <div className="flex flex-col items-center gap-5">
        <div className="serif-brand text-[72px] leading-none">M</div>
        <div className="h-px w-16 bg-[#B58A4A]" />
        <div className="text-center">
          <h1 className="serif-brand text-3xl">미션</h1>
          <p className="mt-3 text-sm font-medium text-[#687282]">교육 운영의 모든 과정을 한곳에서</p>
        </div>
        <div className="mt-4 h-1 w-20 overflow-hidden rounded-full bg-[#E7E1D9]"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#14233B]" /></div>
      </div>
    </div>
  );
}
