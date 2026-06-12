import { motion } from 'framer-motion';
import type { CharacterCosmetic, CharacterProfile, CosmeticSlot } from '../../types';
import CharacterRenderer from './character/CharacterRenderer';

const DEFAULT_COLORS: Partial<Record<CosmeticSlot, string>> = {
  TOP: '#8FD9C4',
  BOTTOM: '#5B7FDB',
  SHOES: '#4A4A4A',
};

interface PlayerCharacterProps {
  profile: CharacterProfile;
  cosmetics: CharacterCosmetic[];
  size?: number;
  facing?: 'down' | 'left' | 'right';
  walking?: boolean;
  className?: string;
}

export default function PlayerCharacter({ profile, cosmetics, size = 96, facing = 'down', walking = false, className = '' }: PlayerCharacterProps) {
  const cosmeticById = new Map(cosmetics.map((c) => [c.id, c]));

  const colorFor = (slot: CosmeticSlot): string | undefined => {
    const id = profile.equipped[slot];
    if (!id) return DEFAULT_COLORS[slot];
    return cosmeticById.get(id)?.color ?? DEFAULT_COLORS[slot];
  };

  const hatId = profile.equipped.HAT;
  const glassesId = profile.equipped.GLASSES;
  const bagId = profile.equipped.BAG;

  return (
    <motion.div
      className={`relative select-none pointer-events-none ${className}`}
      style={{ transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      animate={walking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={walking ? { duration: 0.45, repeat: Infinity } : undefined}
    >
      <CharacterRenderer
        size={size * 0.78}
        skinColor={profile.skinColor}
        hairStyle={profile.hairStyle}
        hairColor={profile.hairColor}
        eyeShape={profile.eyeShape}
        topColor={colorFor('TOP')!}
        bottomColor={colorFor('BOTTOM')!}
        shoesColor={colorFor('SHOES')!}
        socksColor={colorFor('SOCKS')}
        glovesColor={colorFor('GLOVES')}
        hatColor={hatId ? cosmeticById.get(hatId)?.color : undefined}
        glassesColor={glassesId ? cosmeticById.get(glassesId)?.color : undefined}
        bagColor={bagId ? cosmeticById.get(bagId)?.color : undefined}
      />
    </motion.div>
  );
}
