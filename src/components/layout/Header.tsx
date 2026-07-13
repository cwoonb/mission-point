import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showPoints?: boolean;
  rightElement?: React.ReactNode;
}

export default function Header({
  title = '미션',
  showBack = false,
  showPoints = true,
  rightElement,
}: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 flex-shrink-0 border-b border-[#E7E1D9] bg-[#F8F5F0]/95 backdrop-blur-md">
      <div className="flex min-h-14 items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-[10px] text-[#687282] hover:bg-[#F1EDE7]"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <h1 className="truncate text-[17px] font-bold tracking-[-0.02em] text-[#14233B]">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rightElement}
        </div>
      </div>
    </header>
  );
}
