import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GameObjectProps {
  /** 0~100 사이의 가로 위치 (%) */
  x: number;
  /** 0~100 사이의 세로 위치 (%) */
  y: number;
  emoji?: string;
  label?: string;
  size?: number;
  bob?: boolean;
  onClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export default function GameObject({ x, y, emoji, label, size = 40, bob = false, onClick, className = '', children }: GameObjectProps) {
  return (
    <motion.div
      className={`absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={onClick}
      animate={bob ? { y: [0, -5, 0] } : undefined}
      transition={bob ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {children ?? <span style={{ fontSize: size }}>{emoji}</span>}
      {label && (
        <span className="mt-0.5 text-[10px] font-bold text-gray-600 bg-white/70 rounded-full px-1.5 py-0.5 whitespace-nowrap">
          {label}
        </span>
      )}
    </motion.div>
  );
}
