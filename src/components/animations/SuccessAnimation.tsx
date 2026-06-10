import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessAnimationProps {
  isVisible: boolean;
  points?: number;
  title?: string;
  description?: string;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#ec4899', '#3b82f6', '#f97316'];

export default function SuccessAnimation({ isVisible, points, title, description, onClose }: SuccessAnimationProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; color: string; x: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      setConfetti(
        Array.from({ length: 30 }, (_, i) => ({
          id: i,
          color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          x: Math.random() * 100,
          delay: Math.random() * 0.5,
        }))
      );
      const t = setTimeout(onClose, 3000);
      return () => clearTimeout(t);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none px-6"
        >
          {confetti.map((c) => (
            <div
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.x}%`,
                top: '-10px',
                backgroundColor: c.color,
                animationDelay: `${c.delay}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-white rounded-3xl shadow-2xl px-6 py-10 flex flex-col items-center gap-4 text-center pointer-events-auto w-full max-w-xs"
            onClick={onClose}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1.2, 1.2, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="text-6xl"
            >
              🎉
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-gray-800 mb-1">{title ?? '미션 성공!'}</h2>
              {(description || points != null) && (
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-amber-500 font-bold text-xl"
                >
                  {description ?? `+${points!.toLocaleString('ko-KR')}P 획득! ⭐`}
                </motion.p>
              )}
              <p className="text-gray-400 text-sm mt-2">탭해서 닫기</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
