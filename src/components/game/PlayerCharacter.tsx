import { motion } from 'framer-motion';
import type { CharacterCosmetic, CharacterProfile, CosmeticSlot } from '../../types';

const DEFAULT_COLORS: Partial<Record<CosmeticSlot, string>> = {
  TOP: '#8FD9C4',
  BOTTOM: '#5B7FDB',
  SHOES: '#4A4A4A',
};

const EYE_GLYPH: Record<CharacterProfile['eyeShape'], string> = {
  round: '●',
  happy: '⌒',
  sleepy: '─',
  star: '✦',
};

interface PlayerCharacterProps {
  profile: CharacterProfile;
  cosmetics: CharacterCosmetic[];
  size?: number;
  facing?: 'down' | 'left' | 'right';
  walking?: boolean;
  className?: string;
}

export default function PlayerCharacter({
  profile,
  cosmetics,
  size = 96,
  facing = 'down',
  walking = false,
  className = '',
}: PlayerCharacterProps) {
  const cosmeticById = new Map(cosmetics.map((c) => [c.id, c]));

  const colorFor = (slot: CosmeticSlot): string | undefined => {
    const id = profile.equipped[slot];
    if (!id) return DEFAULT_COLORS[slot];
    return cosmeticById.get(id)?.color ?? DEFAULT_COLORS[slot];
  };

  const topColor = colorFor('TOP');
  const bottomColor = colorFor('BOTTOM');
  const shoesColor = colorFor('SHOES');
  const socksColor = colorFor('SOCKS');
  const glovesColor = colorFor('GLOVES');
  const hatId = profile.equipped.HAT;
  const hat = hatId ? cosmeticById.get(hatId) : undefined;
  const glassesId = profile.equipped.GLASSES;
  const glasses = glassesId ? cosmeticById.get(glassesId) : undefined;
  const bagId = profile.equipped.BAG;
  const bag = bagId ? cosmeticById.get(bagId) : undefined;

  const w = size * 0.7;
  const h = size;
  const headSize = size * 0.42;

  return (
    <motion.div
      className={`relative select-none pointer-events-none ${className}`}
      style={{ width: w, height: h, transform: facing === 'left' ? 'scaleX(-1)' : undefined }}
      animate={walking ? { y: [0, -3, 0] } : { y: 0 }}
      transition={walking ? { duration: 0.45, repeat: Infinity } : undefined}
    >
      {/* 가방 (등 뒤) */}
      {bag && (
        <div
          className="absolute rounded-lg flex items-center justify-center text-[10px]"
          style={{
            width: headSize * 0.55,
            height: headSize * 0.7,
            backgroundColor: bag.color,
            top: headSize * 1.05,
            left: -headSize * 0.18,
          }}
        >
          {bag.emoji}
        </div>
      )}

      {/* 다리 */}
      <div className="absolute flex gap-[2px]" style={{ top: headSize * 1.55, left: w * 0.18, width: w * 0.64 }}>
        {[0, 1].map((i) => (
          <div key={i} className="relative rounded-b-md" style={{ width: '48%', height: headSize * 0.55, backgroundColor: bottomColor }}>
            {socksColor && (
              <div
                className="absolute bottom-0 left-0 right-0 rounded-b-md"
                style={{ height: '30%', backgroundColor: socksColor }}
              />
            )}
          </div>
        ))}
      </div>

      {/* 신발 */}
      <div className="absolute flex gap-[2px]" style={{ top: headSize * 2.05, left: w * 0.16, width: w * 0.68 }}>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-md" style={{ width: '48%', height: headSize * 0.22, backgroundColor: shoesColor }} />
        ))}
      </div>

      {/* 팔 */}
      <div className="absolute" style={{ top: headSize * 1.0, left: -w * 0.06, width: headSize * 0.26, height: headSize * 0.7, backgroundColor: topColor, borderRadius: 6 }}>
        {glovesColor && <div className="absolute bottom-0 left-0 right-0 rounded-b-md" style={{ height: '28%', backgroundColor: glovesColor }} />}
      </div>
      <div className="absolute" style={{ top: headSize * 1.0, right: -w * 0.06, width: headSize * 0.26, height: headSize * 0.7, backgroundColor: topColor, borderRadius: 6 }}>
        {glovesColor && <div className="absolute bottom-0 left-0 right-0 rounded-b-md" style={{ height: '28%', backgroundColor: glovesColor }} />}
      </div>

      {/* 몸통 */}
      <div
        className="absolute rounded-xl"
        style={{ top: headSize * 0.92, left: w * 0.12, width: w * 0.76, height: headSize * 0.85, backgroundColor: topColor }}
      />

      {/* 머리 (피부) */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{ top: 0, left: (w - headSize) / 2, width: headSize, height: headSize, backgroundColor: profile.skinColor }}
      >
        {/* 눈 */}
        <div className="flex gap-[6px] items-center justify-center" style={{ fontSize: headSize * 0.18, color: '#3a2c20', marginTop: headSize * 0.08 }}>
          <span>{EYE_GLYPH[profile.eyeShape]}</span>
          <span>{EYE_GLYPH[profile.eyeShape]}</span>
        </div>

        {/* 안경 */}
        {glasses && (
          <div
            className="absolute rounded-md border-2"
            style={{
              top: headSize * 0.36,
              left: headSize * 0.12,
              width: headSize * 0.76,
              height: headSize * 0.22,
              borderColor: glasses.color,
              backgroundColor: 'transparent',
            }}
          />
        )}
      </div>

      {/* 머리카락 */}
      {renderHair(profile.hairStyle, profile.hairColor, headSize, w)}

      {/* 모자 */}
      {hat && (
        <div
          className="absolute rounded-full flex items-center justify-center text-[11px]"
          style={{
            top: -headSize * 0.32,
            left: (w - headSize * 0.9) / 2,
            width: headSize * 0.9,
            height: headSize * 0.55,
            backgroundColor: hat.color,
          }}
        >
          {hat.emoji}
        </div>
      )}
    </motion.div>
  );
}

function renderHair(style: CharacterProfile['hairStyle'], color: string, headSize: number, w: number) {
  const capStyle = {
    position: 'absolute' as const,
    left: (w - headSize) / 2,
    top: 0,
    width: headSize,
    backgroundColor: color,
  };

  switch (style) {
    case 'short':
      return <div style={{ ...capStyle, height: headSize * 0.45, borderRadius: '50% 50% 0 0' }} />;
    case 'long':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.45, borderRadius: '50% 50% 0 0' }} />
          <div style={{ position: 'absolute', left: (w - headSize) / 2 - headSize * 0.06, top: headSize * 0.25, width: headSize * 0.18, height: headSize * 1.1, backgroundColor: color, borderRadius: '0 0 6px 6px' }} />
          <div style={{ position: 'absolute', left: (w + headSize) / 2 - headSize * 0.12, top: headSize * 0.25, width: headSize * 0.18, height: headSize * 1.1, backgroundColor: color, borderRadius: '0 0 6px 6px' }} />
        </>
      );
    case 'ponytail':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.45, borderRadius: '50% 50% 0 0' }} />
          <div style={{ position: 'absolute', left: (w + headSize) / 2 - headSize * 0.08, top: headSize * 0.3, width: headSize * 0.32, height: headSize * 0.32, backgroundColor: color, borderRadius: '40%' }} />
        </>
      );
    case 'curly':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.5, borderRadius: '50%' }} />
          {[0.05, 0.35, 0.65].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: (w - headSize) / 2 + headSize * pos,
                top: -headSize * 0.08,
                width: headSize * 0.32,
                height: headSize * 0.32,
                backgroundColor: color,
                borderRadius: '50%',
              }}
            />
          ))}
        </>
      );
    case 'bowl':
      return <div style={{ ...capStyle, height: headSize * 0.62, borderRadius: '50% 50% 10% 10%' }} />;
    default:
      return null;
  }
}
