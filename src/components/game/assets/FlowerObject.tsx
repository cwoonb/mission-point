import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

export type FlowerColor = 'pink' | 'yellow' | 'purple' | 'white';

const FLOWER_COLORS: Record<FlowerColor, string> = {
  pink: palette.flowerPink,
  yellow: palette.flowerYellow,
  purple: palette.flowerPurple,
  white: palette.flowerWhite,
};

interface FlowerObjectProps {
  color?: FlowerColor;
  size?: number;
}

function Petals({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  const dark = shade(color, 0.18);
  const light = tint(color, 0.25);
  const r = 4.2;
  const offsets = [
    [0, -5.2],
    [4.6, -1.6],
    [2.8, 4.4],
    [-2.8, 4.4],
    [-4.6, -1.6],
  ];
  return (
    <g>
      {offsets.map(([dx, dy], i) => (
        <ellipse key={i} cx={cx + dx} cy={cy + dy} rx={r} ry={r * 0.78} fill={i % 2 === 0 ? color : dark} opacity={0.95} />
      ))}
      <circle cx={cx} cy={cy} r={3.2} fill={palette.flowerCenter} />
      <circle cx={cx - 1} cy={cy - 1} r={1.1} fill={light} opacity="0.8" />
    </g>
  );
}

/** 꽃 오브젝트 — 5장 꽃잎 + 잎 + 그림자, 작은 꽃 세 송이 군집 */
export default function FlowerObject({ color = 'pink', size = 26 }: FlowerObjectProps) {
  const c = FLOWER_COLORS[color];
  const stems: [number, number][] = [[12, 24], [22, 16], [32, 24]];
  return (
    <svg width={size} height={size} viewBox="0 0 44 40" xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={22} cy={37} rx={16} ry={3.4} opacity={0.18} />
      {stems.map(([cx, cy], i) => (
        <g key={i}>
          <path d={`M${cx} ${cy} Q${cx - 2} ${cy + 6} ${cx} 35`} stroke={palette.leafMid} strokeWidth="2" strokeLinecap="round" fill="none" />
          <ellipse cx={cx - 3} cy={cy + 4} rx="3.2" ry="1.6" fill={palette.leafLight} transform={`rotate(-30 ${cx - 3} ${cy + 4})`} />
          <Petals cx={cx} cy={cy} color={c} />
        </g>
      ))}
    </svg>
  );
}
