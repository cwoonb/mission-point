import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GameSceneProps {
  background?: string;
  height?: number;
  children: ReactNode;
  className?: string;
}

export default function GameScene({ background = 'bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200', height = 360, children, className = '' }: GameSceneProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full overflow-hidden rounded-3xl shadow-lg ${background} ${className}`}
      style={{ height }}
    >
      {children}
    </motion.div>
  );
}
