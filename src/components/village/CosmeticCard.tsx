import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import type { CharacterCosmetic } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { useCharacterStore } from '../../store/characterStore';
import { useVillageStore } from '../../store/villageStore';
import { formatPoint } from '../../utils/helpers';
import { COSMETIC_SLOT_LABELS, RARITY_LABELS } from '../../utils/villageRewards';
import { RARITY_GRADIENT } from './DecorationCard';

interface CosmeticCardProps {
  cosmetic: CharacterCosmetic;
  onClick?: () => void;
}

export default function CosmeticCard({ cosmetic, onClick }: CosmeticCardProps) {
  const { currentUser } = useAuthStore();
  const ownsCosmetic = useCharacterStore((s) => s.ownsCosmetic);
  const getVillage = useVillageStore((s) => s.getVillage);

  if (!currentUser) return null;

  const owned = ownsCosmetic(currentUser.id, cosmetic.id);
  const village = getVillage(currentUser.id);
  const villageLevel = village?.level ?? 1;
  const levelLocked = !owned && villageLevel < cosmetic.requiredLevel;
  const canAfford = currentUser.point >= cosmetic.requiredPoint;

  return (
    <motion.div whileTap={{ scale: 0.97 }} onClick={onClick} className="cursor-pointer">
      <div
        className={`bg-gradient-to-br ${RARITY_GRADIENT[cosmetic.rarity]} rounded-2xl aspect-square flex items-center justify-center text-white shadow-md relative overflow-hidden mb-1`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="text-4xl">{cosmetic.emoji}</div>
        {owned && (
          <div className="absolute top-2 left-2 bg-white/90 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <Check size={10} strokeWidth={3} /> 보유중
          </div>
        )}
        {levelLocked && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
            <Lock size={18} className="text-white" />
            <span className="text-white text-[11px] font-bold">Lv.{cosmetic.requiredLevel} 필요</span>
          </div>
        )}
      </div>
      <div className="px-1">
        <p className="text-xs font-semibold text-gray-500 mb-0.5">{COSMETIC_SLOT_LABELS[cosmetic.slot]}</p>
        <p className="text-sm font-bold text-gray-800 leading-tight mb-1">{cosmetic.name}</p>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold ${owned ? 'text-emerald-600' : canAfford ? 'text-amber-600' : 'text-gray-400'}`}>
            {owned ? '보유중' : `⭐ ${formatPoint(cosmetic.requiredPoint)}P`}
          </span>
          <span className="text-[10px] text-gray-400">{RARITY_LABELS[cosmetic.rarity]}</span>
        </div>
      </div>
    </motion.div>
  );
}
