import { motion } from 'framer-motion';

interface MissionBoardProps {
  x: number;
  y: number;
  emoji: string;
  label: string;
  count: number;
  accentColor?: string;
  onClick?: () => void;
}

export default function MissionBoard({ x, y, emoji, label, count, accentColor = '#60A5FA', onClick }: MissionBoardProps) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative bg-amber-50 rounded-xl shadow-md px-3 py-2 flex flex-col items-center border-2 min-w-[64px]" style={{ borderColor: accentColor }}>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-400 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
        <span className="text-xl">{emoji}</span>
        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap mt-0.5">{label}</span>
      </div>
      {/* 게시판 기둥 */}
      <div className="w-1.5 h-6 bg-amber-700 rounded-b-sm" />
    </motion.div>
  );
}
