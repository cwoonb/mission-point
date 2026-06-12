import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import type { DecorationItem } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useDecorationStore } from '../../store/decorationStore';
import { useVillageStore } from '../../store/villageStore';
import { formatPoint } from '../../utils/helpers';
import { DECORATION_CATEGORY_LABELS, RARITY_LABELS } from '../../utils/villageRewards';

export const RARITY_GRADIENT: Record<string, string> = {
  COMMON: 'from-gray-300 to-gray-400',
  RARE: 'from-sky-400 to-blue-400',
  EPIC: 'from-purple-400 to-violet-500',
  LEGENDARY: 'from-amber-400 to-orange-500',
};

interface DecorationCardProps {
  item: DecorationItem;
}

export default function DecorationCard({ item }: DecorationCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const ownsItem = useDecorationStore((s) => s.ownsItem);
  const getVillage = useVillageStore((s) => s.getVillage);

  if (!currentUser) return null;

  const owned = ownsItem(currentUser.id, item.id);
  const village = getVillage(currentUser.id);
  const villageLevel = village?.level ?? 1;
  const levelLocked = !owned && villageLevel < item.requiredLevel;
  const canAfford = currentUser.point >= item.requiredPoint;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/village/shop/${item.id}`)}
      className="cursor-pointer"
    >
      <div
        className={`bg-gradient-to-br ${RARITY_GRADIENT[item.rarity]} rounded-2xl aspect-square flex items-center justify-center text-white shadow-md relative overflow-hidden mb-1`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="text-4xl">{item.emoji}</div>
        {owned && (
          <div className="absolute top-2 left-2 bg-white/90 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Check size={10} strokeWidth={3} /> 보유중
          </div>
        )}
        {levelLocked && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
            <Lock size={18} className="text-white" />
            <span className="text-white text-[11px] font-bold">Lv.{item.requiredLevel} 필요</span>
          </div>
        )}
      </div>
      <div className="px-1">
        <p className="text-xs font-semibold text-gray-500 mb-0.5">{DECORATION_CATEGORY_LABELS[item.category]}</p>
        <p className="text-sm font-bold text-gray-800 leading-tight mb-1">{item.name}</p>
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-bold ${
              owned ? 'text-emerald-600' : canAfford ? 'text-amber-600' : 'text-gray-400'
            }`}
          >
            {owned ? '보유중' : `⭐ ${formatPoint(item.requiredPoint)}P`}
          </span>
          <span className="text-[10px] text-gray-400">{RARITY_LABELS[item.rarity]}</span>
        </div>
      </div>
    </motion.div>
  );
}
