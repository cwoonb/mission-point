import { PanelsTopLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveDemoScenario, resetDemoSession } from '../../data/demoSession';
import { useAuthStore } from '../../store/authStore';

export default function DemoBanner() {
  const navigate = useNavigate();
  const isDemoMode = useAuthStore((state) => state.isDemoMode);
  if (!isDemoMode) return null;
  const scenario = getActiveDemoScenario();
  return <div className="fixed left-1/2 top-[max(0.25rem,env(safe-area-inset-top))] z-[80] flex -translate-x-1/2 items-center gap-2 rounded-[8px] border border-[#D8D0C5] bg-[#FFFDFC]/95 px-3 py-1 text-[10px] font-bold text-[#14233B] shadow-sm backdrop-blur-md">
    <span className="max-w-28 truncate">DEMO · {scenario.name}</span>
    <button type="button" onClick={() => { useAuthStore.getState().logout(); navigate('/login', { replace: true }); }} aria-label="데모 시나리오 변경" className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#E9EDF2]"><PanelsTopLeft size={12}/></button>
    <button type="button" onClick={() => { resetDemoSession(); window.location.reload(); }} aria-label="데모 데이터 초기화" className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#E9EDF2]"><RotateCcw size={12}/></button>
  </div>;
}
