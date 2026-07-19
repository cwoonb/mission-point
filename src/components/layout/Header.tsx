import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showPoints?: boolean;
  rightElement?: ReactNode;
}

export default function Header({
  title = '미션',
  showBack = false,
  rightElement,
}: HeaderProps) {
  const navigate = useNavigate();
  const isDemoMode = useAuthStore((state) => state.isDemoMode);

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 border-b border-[#E7E1D9] bg-[#F8F5F0]/95 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-[10px] text-[#687282] hover:bg-[#F1EDE7]"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h1 className="truncate text-[17px] font-bold tracking-[-0.02em] text-[#14233B]">{title}</h1>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5">{isDemoMode&&<button type="button" onClick={()=>navigate('/profile')} className="min-h-8 rounded-full border border-[#D8C39D] bg-[#FFF9EF] px-2.5 text-[9px] font-bold tracking-wider text-[#9A7138]">DEMO</button>}{rightElement}</div>
      </div>
    </header>
  );
}
