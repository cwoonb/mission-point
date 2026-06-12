import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VillageResident } from '../../types';
import AnimalResident from './assets/AnimalResident';
import BirdResident from './assets/BirdResident';
import { RESIDENT_SPECIES } from './assets/residentSpecies';

interface ResidentNPCProps {
  x: number;
  y: number;
  resident: VillageResident;
  size?: number;
}

export default function ResidentNPC({ x, y, resident, size = 34 }: ResidentNPCProps) {
  const [bubble, setBubble] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    const lines = resident.dialogue.length > 0 ? resident.dialogue : [resident.description];
    const line = lines[Math.floor(Math.random() * lines.length)];
    setBubble(line);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setBubble(null), 3000);
  };

  const speciesInfo = RESIDENT_SPECIES[resident.emoji];

  return (
    <motion.div
      className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 cursor-pointer active:scale-95"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={handleClick}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <AnimatePresence>
        {bubble && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full mb-2 bg-white rounded-xl shadow-md px-2.5 py-1.5 max-w-[140px] text-[10px] font-bold text-gray-700 text-center z-20"
          >
            {bubble}
            <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-white rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
      {speciesInfo?.kind === 'bird' ? (
        <BirdResident species={speciesInfo.species} size={size} />
      ) : (
        <AnimalResident species={speciesInfo?.species ?? 'dog'} size={size} />
      )}
      <span className="mt-0.5 text-[10px] font-bold text-gray-600 bg-white/70 rounded-full px-1.5 py-0.5 whitespace-nowrap">{resident.name}</span>
    </motion.div>
  );
}
