import { motion } from 'framer-motion';
import { palette, shade, tint } from '../assets/palette';
import GroundShadow from '../assets/Shadow';
import { ShingleRows, PlankLines } from '../assets/BuildingDetails';

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

/** 지붕 레이어 — 기와 줄무늬 + 처마 + 굴뚝 포함 */
export function RoofLayer({ width, roofHeight, colors, hasChimney }: { width: number; roofHeight: number; colors: HouseColors; hasChimney?: boolean }) {
  const chimneyX = width * 0.68;
  const chimneyW = width * 0.09;
  const chimneyH = roofHeight * 0.55;
  return (
    <g>
      <path d={`M0 ${roofHeight} L${width / 2} 0 L${width} ${roofHeight} Z`} fill={colors.roof} />
      <path d={`M${width / 2} 0 L${width * 0.56} ${roofHeight * 0.1} L${width * 0.1} ${roofHeight} L0 ${roofHeight} Z`} fill={tint(colors.roof, 0.16)} opacity="0.55" />
      <path d={`M${width / 2} 0 L${width} ${roofHeight} L${width * 0.86} ${roofHeight} L${width / 2} ${roofHeight * 0.18} Z`} fill={colors.roofShade} opacity="0.5" />
      <ShingleRows apex={[width / 2, 0]} left={[0, roofHeight]} right={[width, roofHeight]} color={colors.roof} rows={6} />
      {/* 처마 */}
      <rect x={-width * 0.02} y={roofHeight - width * 0.025} width={width * 1.04} height={width * 0.05} rx={width * 0.02} fill={shade(colors.roof, 0.14)} />
      <rect x={-width * 0.02} y={roofHeight - width * 0.025} width={width * 1.04} height={width * 0.015} rx={width * 0.01} fill={tint(colors.roof, 0.2)} opacity="0.6" />
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
      <rect x={x} y={top} width={width * 0.35} height={height} fill="#BDBDBD" opacity="0.6" />
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

/** 벽 레이어 — 가로 판자 텍스처 + 상단 하이라이트 + 하단 기초 띠 */
export function WallLayer({ width, wallHeight, roofHeight, colors }: { width: number; wallHeight: number; roofHeight: number; colors: HouseColors }) {
  const top = roofHeight - 4;
  return (
    <g>
      <rect x="2" y={top} width={width - 4} height={wallHeight} rx="10" fill={colors.wall} />
      <PlankLines x={2} y={top} width={width - 4} height={wallHeight} color={colors.wallShade} gap={width * 0.09} />
      <rect x="2" y={top} width={width - 4} height={wallHeight * 0.16} rx="10" fill={tint(colors.wall, 0.5)} opacity="0.35" />
      <rect x="2" y={top + wallHeight - wallHeight * 0.13} width={width - 4} height={wallHeight * 0.13} fill={colors.wallShade} opacity="0.6" />
      <rect x="2" y={top} width={width - 4} height={wallHeight} rx="10" fill="none" stroke={colors.trim} strokeWidth="3" />
    </g>
  );
}

/** 창문 레이어 — 유리 그라데이션 + 반사광 + 십자 프레임, tier에 따라 개수 증가 */
export function WindowLayer({ width, wallHeight, roofHeight, count, colors }: { width: number; wallHeight: number; roofHeight: number; count: number; colors: HouseColors }) {
  const winSize = width * 0.17;
  const gap = (width - count * winSize) / (count + 1);
  const glass = tint(colors.window, 0.18);
  const glassDeep = shade(colors.window, 0.1);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = gap * (i + 1) + winSize * i;
        const y = roofHeight + wallHeight * 0.14;
        return (
          <g key={i}>
            <rect x={x - 2.5} y={y - 2.5} width={winSize + 5} height={winSize + 5} rx="4" fill={colors.trim} />
            <rect x={x} y={y} width={winSize} height={winSize} rx="3" fill={glassDeep} />
            <rect x={x} y={y} width={winSize} height={winSize * 0.5} rx="3" fill={glass} />
            <path d={`M${x + winSize * 0.12} ${y + winSize * 0.85} L${x + winSize * 0.12} ${y + winSize * 0.3} L${x + winSize * 0.55} ${y + winSize * 0.85} Z`} fill="#FFFFFF" opacity="0.35" />
            <line x1={x + winSize / 2} y1={y} x2={x + winSize / 2} y2={y + winSize} stroke={colors.trim} strokeWidth="2.4" />
            <line x1={x} y1={y + winSize / 2} x2={x + winSize} y2={y + winSize / 2} stroke={colors.trim} strokeWidth="2.4" />
            <rect x={x} y={y} width={winSize} height={winSize} rx="3" fill="none" stroke={shade(colors.trim, 0.15)} strokeWidth="1.5" />
          </g>
        );
      })}
    </g>
  );
}

/** 문 레이어 — 문틀 + 2단 명암 + 위쪽 유리창 + 나뭇결 + 손잡이 */
export function DoorLayer({ width, wallHeight, roofHeight, colors }: { width: number; wallHeight: number; roofHeight: number; colors: HouseColors }) {
  const doorW = width * 0.24;
  const doorH = wallHeight * 0.64;
  const x = (width - doorW) / 2;
  const y = roofHeight - 4 + wallHeight - doorH;
  const doorLight = tint(colors.door, 0.18);
  const doorDark = shade(colors.door, 0.18);
  return (
    <g>
      <rect x={x - 3} y={y - 3} width={doorW + 6} height={doorH + 3} rx="6" fill={colors.trim} />
      <rect x={x} y={y} width={doorW} height={doorH} rx="5" fill={colors.door} />
      <rect x={x} y={y} width={doorW * 0.45} height={doorH} fill={doorLight} opacity="0.35" />
      <rect x={x + doorW * 0.55} y={y} width={doorW * 0.45} height={doorH} fill={doorDark} opacity="0.3" />
      <rect x={x + doorW * 0.18} y={y + doorH * 0.1} width={doorW * 0.64} height={doorH * 0.28} rx="3" fill={tint(colors.window, 0.12)} opacity="0.9" />
      <line x1={x + doorW / 2} y1={y + doorH * 0.1} x2={x + doorW / 2} y2={y + doorH * 0.38} stroke={colors.trim} strokeWidth="1.5" />
      {[0.3, 0.5, 0.7].map((f) => (
        <path key={f} d={`M${x + doorW * f} ${y + doorH * 0.45} q${doorW * 0.04} ${doorH * 0.1} 0 ${doorH * 0.18}`} stroke={doorDark} strokeWidth="1" fill="none" opacity="0.3" />
      ))}
      <circle cx={x + doorW * 0.82} cy={y + doorH * 0.52} r={width * 0.013} fill="#FFE9A8" />
      <circle cx={x + doorW * 0.82} cy={y + doorH * 0.52} r={width * 0.013} fill="none" stroke={doorDark} strokeWidth="0.6" />
    </g>
  );
}

/** 작은 화분 — 집 앞에 놓는 장식 */
function FlowerPot({ x, y, size, flower }: { x: number; y: number; size: number; flower: string }) {
  const pot = palette.roofBrown;
  return (
    <g>
      <path d={`M${x} ${y} h${size} l${-size * 0.12} ${size * 0.55} h${-size * 0.76} Z`} fill={pot} />
      <path d={`M${x} ${y} h${size * 0.42} l${-size * 0.07} ${size * 0.55} h${-size * 0.3} Z`} fill={tint(pot, 0.18)} opacity="0.6" />
      <ellipse cx={x + size / 2} cy={y} rx={size * 0.52} ry={size * 0.12} fill={shade(pot, 0.15)} />
      {[-0.18, 0.18].map((dx, i) => (
        <circle key={i} cx={x + size * (0.5 + dx)} cy={y - size * 0.15} r={size * 0.15} fill={i % 2 === 0 ? flower : tint(flower, 0.2)} />
      ))}
      <circle cx={x + size * 0.5} cy={y - size * 0.32} r={size * 0.13} fill={palette.leafMid} />
    </g>
  );
}

/** 마당 레이어 — 집 그림자 + 문 앞 디딤돌 + 화분 */
export function YardLayer({ width, groundY, doorW }: { width: number; groundY: number; doorW: number }) {
  return (
    <g>
      <GroundShadow cx={width / 2} cy={groundY - width * 0.01} rx={width * 0.46} ry={width * 0.06} opacity={0.22} />
      {[0.5, 0.4, 0.6].map((fx, i) => (
        <ellipse key={i} cx={width * fx} cy={groundY - width * 0.015 - i * width * 0.045} rx={width * 0.05} ry={width * 0.02} fill={palette.stone} opacity={0.9} />
      ))}
      {[0.5, 0.4, 0.6].map((fx, i) => (
        <ellipse key={`hl-${i}`} cx={width * fx - width * 0.015} cy={groundY - width * 0.018 - i * width * 0.045} rx={width * 0.022} ry={width * 0.007} fill={tint(palette.stone, 0.2)} opacity={0.7} />
      ))}
      <FlowerPot x={width * 0.5 - doorW * 1.7} y={groundY - width * 0.02} size={width * 0.1} flower={palette.flowerPink} />
      <FlowerPot x={width * 0.5 + doorW * 0.7} y={groundY - width * 0.02} size={width * 0.1} flower={palette.flowerYellow} />
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

/** 집 전체를 SVG 레이어로 합성한다 (지붕/굴뚝 → 벽 → 창문 → 문 → 마당) */
export default function HouseRenderer({ tier = 1, size = 150, onClick, label, className = '' }: HouseRendererProps) {
  const colors = TIER_COLORS[tier];
  const scale = tier === 3 ? 1.15 : tier === 2 ? 1.06 : 1;
  const width = 160 * scale;
  const roofHeight = width * 0.46;
  const wallHeight = width * 0.5;
  const yardHeight = width * 0.12;
  const height = roofHeight + wallHeight + yardHeight;
  const displayScale = size / width;

  return (
    <motion.div
      className={`relative ${onClick ? 'cursor-pointer active:scale-95' : ''} ${className}`}
      style={{ width: width * displayScale, height: height * displayScale }}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.03 } : undefined}
    >
      <svg width={width * displayScale} height={height * displayScale} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <YardLayer width={width} groundY={roofHeight + wallHeight + yardHeight * 0.7} doorW={width * 0.24} />
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
