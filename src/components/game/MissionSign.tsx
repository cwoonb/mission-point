import { motion } from 'framer-motion';

interface MissionSignProps {
  /** 0~100 사이의 가로 위치 (%) */
  x: number;
  /** 0~100 사이의 세로 위치 (%) */
  y: number;
  emoji: string;
  label: string;
  sublabel?: string;
  accentColor?: string;
  onClick?: () => void;
}

export default function MissionSign({ x, y, emoji, label, sublabel, accentColor = '#60A5FA', onClick }: MissionSignProps) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="bg-white rounded-xl shadow-md px-2.5 py-1.5 flex items-center gap-1.5 max-w-[120px] border-t-4"
        style={{ borderColor: accentColor }}
      >
        <span className="text-base flex-shrink-0">{emoji}</span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-gray-700 truncate leading-tight">{label}</p>
          {sublabel && <p className="text-[9px] font-semibold leading-tight" style={{ color: accentColor }}>{sublabel}</p>}
        </div>
      </div>
      {/* 표지판 기둥 */}
      <div className="w-1.5 h-5 bg-amber-700 rounded-b-sm" />
    </motion.div>
  );
}
