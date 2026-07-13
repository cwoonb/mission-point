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
    <header className="sticky top-0 z-40 flex-shrink-0 border-b border-white/70 bg-white/88 shadow-[0_8px_22px_rgba(31,41,55,0.06)] backdrop-blur-md">
      <div className="flex items-center justify-between px-3.5 py-3 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              aria-label="뒤로 가기"
              className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 active:scale-90 transition-all flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
          ) : null}
          <h1 className="font-black text-gray-800 text-base truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rightElement}
        </div>
      </div>
    </header>
  );
}
