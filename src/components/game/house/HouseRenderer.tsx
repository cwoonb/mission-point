import { motion } from 'framer-motion';

export type HouseTier = 1 | 2 | 3;

interface HouseColors {
  roof: string;
  roofShade: string;
  wall: string;
  wallShade: string;
  door: string;
  window: string;
  trim: string;
}

const TIER_COLORS: Record<HouseTier, HouseColors> = {
  1: { roof: '#E2664E', roofShade: '#C9503A', wall: '#FFF6E5', wallShade: '#F0E2C8', door: '#C97B4A', window: '#BEEAF5', trim: '#F4D9B5' },
  2: { roof: '#9C6F4E', roofShade: '#7E5A3E', wall: '#F6ECD9', wallShade: '#E6D7BC', door: '#8B5A3C', window: '#CFEFE0', trim: '#E3C9A5' },
  3: { roof: '#6F8FCB', roofShade: '#5A76AD', wall: '#F1F0F7', wallShade: '#E0DEEE', door: '#5A5A82', window: '#D7E3FB', trim: '#C9D2F2' },
};

/** 지붕 레이어 — 굴뚝 포함 */
export function RoofLayer({ width, roofHeight, colors, hasChimney }: { width: number; roofHeight: number; colors: HouseColors; hasChimney?: boolean }) {
  const chimneyX = width * 0.68;
  const chimneyW = width * 0.09;
  const chimneyH = roofHeight * 0.55;
  return (
    <g>
      <path d={`M0 ${roofHeight} L${width / 2} 0 L${width} ${roofHeight} Z`} fill={colors.roof} />
      <path d={`M${width / 2} 0 L${width} ${roofHeight} L${width * 0.86} ${roofHeight} L${width / 2} ${roofHeight * 0.18} Z`} fill={colors.roofShade} opacity="0.5" />
      {hasChimney && <ChimneyLayer x={chimneyX} width={chimneyW} height={chimneyH} top={roofHeight * 0.18} />}
    </g>
  );
}

/** 굴뚝 레이어 — 위로 떠오르는 연기 애니메이션 포함 */
export function ChimneyLayer({ x, width, height, top }: { x: number; width: number; height: number; top: number }) {
  const cx = x + width / 2;
  return (
    <g style={{ overflow: 'visible' }}>
      <rect x={x} y={top} width={width} height={height} rx={width * 0.18} fill="#A8A8A8" />
      <rect x={x} y={top} width={width} height={height * 0.22} rx={width * 0.18} fill="#8F8F8F" />
      {[0, 1].map((i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={top}
          r={width * 0.32}
          fill="#E8E8E8"
          animate={{ cy: [top, top - height * 1.4], opacity: [0.55, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 1.2, ease: 'easeOut' }}
        />
      ))}
    </g>
  );
}

/** 벽 레이어 */
export function WallLayer({ width, wallHeight, roofHeight, colors }: { width: number; wallHeight: number; roofHeight: number; colors: HouseColors }) {
  return (
    <g>
      <rect x="2" y={roofHeight - 4} width={width - 4} height={wallHeight} rx="10" fill={colors.wall} />
      <rect x="2" y={roofHeight - 4 + wallHeight - 10} width={width - 4} height="10" fill={colors.wallShade} opacity="0.5" />
      <rect x="2" y={roofHeight - 4} width={width - 4} height={wallHeight} rx="10" fill="none" stroke={colors.trim} strokeWidth="3" />
    </g>
  );
}

/** 창문 레이어 — tier에 따라 개수 증가 */
export function WindowLayer({ width, wallHeight, roofHeight, count, colors }: { width: number; wallHeight: number; roofHeight: number; count: number; colors: HouseColors }) {
  const winSize = width * 0.16;
  const gap = (width - count * winSize) / (count + 1);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = gap * (i + 1) + winSize * i;
        const y = roofHeight + wallHeight * 0.12;
        return (
          <g key={i}>
            <rect x={x} y={y} width={winSize} height={winSize} rx="4" fill={colors.window} stroke={colors.trim} strokeWidth="2.5" />
            <line x1={x + winSize / 2} y1={y} x2={x + winSize / 2} y2={y + winSize} stroke={colors.trim} strokeWidth="2" />
            <line x1={x} y1={y + winSize / 2} x2={x + winSize} y2={y + winSize / 2} stroke={colors.trim} strokeWidth="2" />
          </g>
        );
      })}
    </g>
  );
}

/** 문 레이어 */
export function DoorLayer({ width, wallHeight, roofHeight, colors }: { width: number; wallHeight: number; roofHeight: number; colors: HouseColors }) {
  const doorW = width * 0.22;
  const doorH = wallHeight * 0.62;
  const x = (width - doorW) / 2;
  const y = roofHeight - 4 + wallHeight - doorH;
  return (
    <g>
      <rect x={x} y={y} width={doorW} height={doorH} rx="6" fill={colors.door} />
      <circle cx={x + doorW * 0.78} cy={y + doorH * 0.5} r={width * 0.012} fill="#FFE9A8" />
    </g>
  );
}

interface HouseRendererProps {
  tier?: HouseTier;
  size?: number;
  onClick?: () => void;
  label?: string;
  className?: string;
}

/** 집 전체를 SVG 레이어로 합성한다 (지붕/굴뚝 → 벽 → 창문 → 문) */
export default function HouseRenderer({ tier = 1, size = 150, onClick, label, className = '' }: HouseRendererProps) {
  const colors = TIER_COLORS[tier];
  const scale = tier === 3 ? 1.15 : tier === 2 ? 1.06 : 1;
  const width = 160 * scale;
  const roofHeight = width * 0.46;
  const wallHeight = width * 0.5;
  const height = roofHeight + wallHeight;
  const displayScale = size / width;

  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      style={{ width: width * displayScale, height: height * displayScale }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.03 } : undefined}
    >
      <svg width={width * displayScale} height={height * displayScale} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <RoofLayer width={width} roofHeight={roofHeight} colors={colors} hasChimney={tier >= 2} />
        <WallLayer width={width} wallHeight={wallHeight} roofHeight={roofHeight} colors={colors} />
        <WindowLayer width={width} wallHeight={wallHeight} roofHeight={roofHeight} count={tier} colors={colors} />
        <DoorLayer width={width} wallHeight={wallHeight} roofHeight={roofHeight} colors={colors} />
      </svg>
      {label && <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-600 bg-white/80 rounded-full px-2 py-0.5 whitespace-nowrap z-10">{label}</span>}
    </motion.div>
  );
}

/** 보유한 HOUSE 장식 아이템 id로부터 집 등급을 결정한다 (확장 가능) */
export function houseTierFromItemId(itemId: string | undefined): HouseTier {
  if (itemId === 'deco-house-tower') return 3;
  if (itemId === 'deco-house-cottage') return 2;
  return 1;
}
