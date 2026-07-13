import { RotateCcw } from 'lucide-react';
import { resetDemoSession } from '../../data/demoSession';
import { useAuthStore } from '../../store/authStore';

export default function DemoBanner() {
  const isDemoMode = useAuthStore((state) => state.isDemoMode);
  if (!isDemoMode) return null;
  return <div className="fixed left-1/2 top-[max(0.25rem,env(safe-area-inset-top))] z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-purple-700 px-3 py-1 text-[10px] font-black text-white shadow-lg">
    <span>DEMO · 체험용 데이터</span>
    <button type="button" onClick={() => { resetDemoSession(); window.location.reload(); }} aria-label="데모 데이터 초기화" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20"><RotateCcw size={12}/></button>
  </div>;
}
