import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { initializeData: initAuth, currentUser } = useAuthStore();
  const { initializeData: initMissions } = useMissionStore();
  const { initializeData: initShop } = useShopStore();

  useEffect(() => {
    initAuth();
    initMissions();
    initShop();

    const timer = setTimeout(() => {
      navigate(currentUser ? '/' : '/login', { replace: true });
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const stars = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 8 + Math.random() * 16,
    delay: Math.random() * 1.5,
  }));

  return (
    <div className="page-container min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-violet-500 to-indigo-600 overflow-hidden">
      {stars.map((s) => (
        <motion.div
          key={s.id}
          className="absolute text-white/30 select-none"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: s.size }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, delay: s.delay, repeat: Infinity }}
        >
          ⭐
        </motion.div>
      ))}

      <div className="relative flex flex-col items-center gap-6 z-10">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.2 }}
          className="w-28 h-28 bg-white/20 rounded-[2rem] flex items-center justify-center shadow-2xl backdrop-blur-sm"
        >
          <span className="text-6xl">🎯</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h1 className="text-white font-black text-4xl mb-2 tracking-tight">
            미션 포인트
          </h1>
          <p className="text-white/70 text-base font-medium">
            미션을 완료하고 포인트를 모아보세요! 🌟
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-2 mt-4"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 0.8, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
