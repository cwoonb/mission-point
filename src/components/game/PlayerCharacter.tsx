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

  // SD(치비) 비율: 머리는 크고 몸은 짧게
  const headSize = size * 0.56;
  const w = size * 0.78;
  const bodyTop = headSize * 0.86;
  const bodyHeight = headSize * 0.5;
  const legTop = bodyTop + bodyHeight - headSize * 0.04;
  const legHeight = headSize * 0.34;
  const shoeTop = legTop + legHeight - headSize * 0.04;
  const shoeHeight = headSize * 0.2;
  const h = shoeTop + shoeHeight;

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
          className="absolute rounded-lg flex items-center justify-center text-[10px] shadow-sm"
          style={{
            width: headSize * 0.5,
            height: headSize * 0.62,
            backgroundColor: bag.color,
            top: bodyTop + headSize * 0.05,
            left: -headSize * 0.16,
          }}
        >
          {bag.emoji}
        </div>
      )}

      {/* 다리 */}
      <div className="absolute flex gap-[3px]" style={{ top: legTop, left: w * 0.2, width: w * 0.6 }}>
        {[0, 1].map((i) => (
          <div key={i} className="relative rounded-b-lg" style={{ width: '48%', height: legHeight, backgroundColor: bottomColor }}>
            {socksColor && (
              <div className="absolute bottom-0 left-0 right-0 rounded-b-lg" style={{ height: '32%', backgroundColor: socksColor }} />
            )}
          </div>
        ))}
      </div>

      {/* 신발 */}
      <div className="absolute flex gap-[3px]" style={{ top: shoeTop, left: w * 0.16, width: w * 0.68 }}>
        {[0, 1].map((i) => (
          <div key={i} className="rounded-lg shadow-sm" style={{ width: '48%', height: shoeHeight, backgroundColor: shoesColor }} />
        ))}
      </div>

      {/* 팔 */}
      <div
        className="absolute rounded-lg"
        style={{ top: bodyTop + headSize * 0.04, left: -w * 0.07, width: headSize * 0.24, height: bodyHeight * 0.85, backgroundColor: topColor }}
      >
        {glovesColor && <div className="absolute bottom-0 left-0 right-0 rounded-b-lg" style={{ height: '30%', backgroundColor: glovesColor }} />}
      </div>
      <div
        className="absolute rounded-lg"
        style={{ top: bodyTop + headSize * 0.04, right: -w * 0.07, width: headSize * 0.24, height: bodyHeight * 0.85, backgroundColor: topColor }}
      >
        {glovesColor && <div className="absolute bottom-0 left-0 right-0 rounded-b-lg" style={{ height: '30%', backgroundColor: glovesColor }} />}
      </div>

      {/* 몸통 */}
      <div
        className="absolute rounded-2xl"
        style={{ top: bodyTop, left: w * 0.14, width: w * 0.72, height: bodyHeight, backgroundColor: topColor, boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.06)' }}
      />

      {/* 머리 (피부) - SD 비율로 크게 */}
      <div
        className="absolute rounded-full flex flex-col items-center justify-center"
        style={{
          top: 0,
          left: (w - headSize) / 2,
          width: headSize,
          height: headSize,
          backgroundColor: profile.skinColor,
          boxShadow: 'inset 0 -8px 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* 볼 홍조 */}
        <div className="absolute rounded-full bg-rose-300/50" style={{ width: headSize * 0.14, height: headSize * 0.09, left: headSize * 0.07, top: headSize * 0.56 }} />
        <div className="absolute rounded-full bg-rose-300/50" style={{ width: headSize * 0.14, height: headSize * 0.09, right: headSize * 0.07, top: headSize * 0.56 }} />

        {/* 눈 */}
        <div className="flex gap-[8px] items-center justify-center" style={{ fontSize: headSize * 0.22, color: '#3a2c20', marginTop: headSize * 0.05 }}>
          <span>{EYE_GLYPH[profile.eyeShape]}</span>
          <span>{EYE_GLYPH[profile.eyeShape]}</span>
        </div>

        {/* 입 */}
        <div className="rounded-full bg-rose-400/70" style={{ width: headSize * 0.16, height: headSize * 0.06, marginTop: headSize * 0.1 }} />

        {/* 안경 */}
        {glasses && (
          <div
            className="absolute rounded-md border-2"
            style={{
              top: headSize * 0.4,
              left: headSize * 0.1,
              width: headSize * 0.8,
              height: headSize * 0.24,
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
            top: -headSize * 0.3,
            left: (w - headSize * 0.9) / 2,
            width: headSize * 0.9,
            height: headSize * 0.5,
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
      return <div style={{ ...capStyle, height: headSize * 0.42, borderRadius: '50% 50% 0 0' }} />;
    case 'long':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.42, borderRadius: '50% 50% 0 0' }} />
          <div style={{ position: 'absolute', left: (w - headSize) / 2 - headSize * 0.06, top: headSize * 0.22, width: headSize * 0.18, height: headSize * 0.95, backgroundColor: color, borderRadius: '0 0 8px 8px' }} />
          <div style={{ position: 'absolute', left: (w + headSize) / 2 - headSize * 0.12, top: headSize * 0.22, width: headSize * 0.18, height: headSize * 0.95, backgroundColor: color, borderRadius: '0 0 8px 8px' }} />
        </>
      );
    case 'ponytail':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.42, borderRadius: '50% 50% 0 0' }} />
          <div style={{ position: 'absolute', left: (w + headSize) / 2 - headSize * 0.08, top: headSize * 0.28, width: headSize * 0.32, height: headSize * 0.32, backgroundColor: color, borderRadius: '40%' }} />
        </>
      );
    case 'curly':
      return (
        <>
          <div style={{ ...capStyle, height: headSize * 0.46, borderRadius: '50%' }} />
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
      return <div style={{ ...capStyle, height: headSize * 0.58, borderRadius: '50% 50% 10% 10%' }} />;
    default:
      return null;
  }
}
