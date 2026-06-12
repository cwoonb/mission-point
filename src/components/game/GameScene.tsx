import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GameSceneProps {
  background?: string;
  height?: number;
  children: ReactNode;
  className?: string;
  /** 빈 배경을 탭했을 때 호출 (탭-이동용). 자식 요소를 직접 탭한 경우는 호출되지 않음 */
  onBackgroundTap?: (xPct: number, yPct: number) => void;
}

export default function GameScene({ background = 'bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200', height = 360, children, className = '', onBackgroundTap }: GameSceneProps) {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onBackgroundTap || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    onBackgroundTap(xPct, yPct);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`relative w-full overflow-hidden rounded-3xl shadow-lg ${background} ${onBackgroundTap ? 'cursor-pointer' : ''} ${className}`}
      style={{ height }}
    >
      {children}
    </motion.div>
  );
}
