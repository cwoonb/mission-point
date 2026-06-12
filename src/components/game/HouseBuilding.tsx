import { motion } from 'framer-motion';

export type HouseTier = 1 | 2 | 3;

interface HouseBuildingProps {
  /** 집 등급 — 외형(지붕/벽/문/창문)이 등급별로 달라지며, 향후 부위별 커스터마이징의 기반이 된다 */
  tier?: HouseTier;
  size?: number;
  onClick?: () => void;
  label?: string;
  className?: string;
}

const TIER_COLORS: Record<HouseTier, { roof: string; wall: string; door: string; window: string; trim: string }> = {
  1: { roof: '#E8A06A', wall: '#FFF6E5', door: '#C97B4A', window: '#BEEAF5', trim: '#F4D9B5' },
  2: { roof: '#B5654A', wall: '#F6ECD9', door: '#8B5A3C', window: '#CFEFE0', trim: '#E3C9A5' },
  3: { roof: '#7E8FCB', wall: '#F1F0F7', door: '#5A5A82', window: '#D7E3FB', trim: '#C9D2F2' },
};

export default function HouseBuilding({ tier = 1, size = 150, onClick, label, className = '' }: HouseBuildingProps) {
  const colors = TIER_COLORS[tier];
  const scale = tier === 3 ? 1.15 : tier === 2 ? 1.06 : 1;
  const width = size * scale;
  const roofHeight = width * 0.46;
  const wallHeight = width * 0.58;
  const windowCount = tier;

  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      style={{ width, height: roofHeight + wallHeight }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.03 } : undefined}
    >
      {/* 굴뚝 + 연기 (2/3단계 집) */}
      {tier >= 2 && (
        <>
          <div
            className="absolute rounded-sm"
            style={{ width: width * 0.09, height: roofHeight * 0.5, right: width * 0.18, top: roofHeight * 0.05, backgroundColor: '#9b9b9b' }}
          />
          <motion.div
            className="absolute text-sm"
            style={{ right: width * 0.15, top: -roofHeight * 0.35 }}
            animate={{ y: [0, -8, 0], opacity: [0.7, 0.15, 0.7] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            💨
          </motion.div>
        </>
      )}

      {/* 깃발 (3단계 타워하우스) */}
      {tier === 3 && (
        <div className="absolute text-base" style={{ left: '50%', top: -roofHeight * 0.32, transform: 'translateX(-50%)' }}>
          🚩
        </div>
      )}

      {/* 지붕 */}
      <div
        className="absolute top-0"
        style={{
          left: 0,
          width: 0,
          height: 0,
          borderLeft: `${width / 2}px solid transparent`,
          borderRight: `${width / 2}px solid transparent`,
          borderBottom: `${roofHeight}px solid ${colors.roof}`,
        }}
      />

      {/* 벽 + 문 + 창문 */}
      <div
        className="absolute rounded-b-2xl shadow-lg overflow-hidden"
        style={{ left: 0, top: roofHeight - 2, width, height: wallHeight, backgroundColor: colors.wall, border: `3px solid ${colors.trim}` }}
      >
        <div className="absolute top-[14%] left-0 right-0 flex justify-center gap-[10%] px-[12%]">
          {Array.from({ length: windowCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-md"
              style={{ width: width * 0.16, height: width * 0.16, backgroundColor: colors.window, border: `2px solid ${colors.trim}` }}
            />
          ))}
        </div>

        <div
          className="absolute bottom-0 rounded-t-lg"
          style={{ left: '50%', transform: 'translateX(-50%)', width: width * 0.26, height: wallHeight * 0.55, backgroundColor: colors.door }}
        >
          <div className="absolute rounded-full bg-yellow-200" style={{ width: width * 0.025, height: width * 0.025, right: width * 0.03, top: '45%' }} />
        </div>
      </div>

      {label && (
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 bg-white/80 rounded-full px-2 py-0.5 whitespace-nowrap z-10">
          {label}
        </span>
      )}
    </motion.div>
  );
}

/** 보유한 HOUSE 장식 아이템 id로부터 집 등급을 결정한다 (확장 가능) */
export function houseTierFromItemId(itemId: string | undefined): HouseTier {
  if (itemId === 'deco-house-tower') return 3;
  if (itemId === 'deco-house-cottage') return 2;
  return 1;
}
