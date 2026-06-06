import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Repeat2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { formatPoint } from '../../utils/helpers';
import { motion } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showPoints?: boolean;
  rightElement?: React.ReactNode;
}

export default function Header({
  title = '미션 포인트 🎯',
  showBack = false,
  showPoints = true,
  rightElement,
}: HeaderProps) {
  const navigate = useNavigate();
  const { currentUser, viewMode, switchViewMode } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm flex-shrink-0">
      <div className="flex items-center justify-between px-3 py-3 gap-2">
        {/* 왼쪽: 뒤로가기 or 아이콘 + 제목 */}
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-xl text-gray-500 hover:bg-gray-100 active:scale-90 transition-all flex-shrink-0"
            >
              <ChevronLeft size={20} />
            </button>
          ) : (
            <span className="text-lg flex-shrink-0">🎯</span>
          )}
          <h1 className="font-bold text-gray-800 text-sm truncate">{title}</h1>
        </div>

        {/* 오른쪽: 포인트 + 역할 전환 + 커스텀 버튼 */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {showPoints && currentUser && (
            <motion.div
              key={currentUser.point}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"
            >
              <span className="text-amber-500 text-xs">⭐</span>
              <span className="text-amber-700 font-bold text-xs whitespace-nowrap">
                {formatPoint(currentUser.point)}P
              </span>
            </motion.div>
          )}

          {currentUser && currentUser.role !== 'CHILD' && (
            <button
              onClick={switchViewMode}
              className="flex items-center gap-0.5 bg-purple-50 border border-purple-200 px-2 py-1 rounded-full active:scale-90 transition-all"
              title="역할 전환"
            >
              <Repeat2 size={11} className="text-purple-500" />
              <span className="text-purple-700 text-[10px] font-bold">
                {viewMode === 'FACILITATOR' ? '진행자' : '수행자'}
              </span>
            </button>
          )}

          {rightElement}
        </div>
      </div>
    </header>
  );
}
