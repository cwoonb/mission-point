import { motion } from 'framer-motion';
import type { VillageResident } from '../../types';

interface ResidentCardProps {
  resident: VillageResident;
  owned: boolean;
}

export default function ResidentCard({ resident, owned }: ResidentCardProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className={`rounded-2xl p-4 text-center shadow-sm ${owned ? 'bg-white' : 'bg-gray-100'}`}
    >
      <div className={`text-4xl mb-2 ${owned ? '' : 'opacity-30 grayscale'}`}>{resident.emoji}</div>
      <p className={`text-sm font-bold ${owned ? 'text-gray-800' : 'text-gray-400'}`}>
        {owned ? resident.name : '???'}
      </p>
      <p className="text-[11px] text-gray-400 mt-1 leading-snug">
        {owned ? resident.personality : resident.unlockHint}
      </p>
    </motion.div>
  );
}
