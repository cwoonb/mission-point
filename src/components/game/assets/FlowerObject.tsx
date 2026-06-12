import { palette } from './palette';

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

/** 🌷 → SVG 꽃 오브젝트 (작은 꽃 세 송이 군집) */
export default function FlowerObject({ color = 'pink', size = 26 }: FlowerObjectProps) {
  const c = FLOWER_COLORS[color];
  const stems: [number, number][] = [[12, 26], [22, 18], [32, 26]];
  return (
    <svg width={size} height={size} viewBox="0 0 44 40" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="22" cy="37" rx="17" ry="3" fill={palette.leafDark} opacity="0.22" />
      {stems.map(([cx, cy], i) => (
        <g key={i}>
          <path d={`M${cx} ${cy} L${cx} 36`} stroke={palette.leafMid} strokeWidth="2" strokeLinecap="round" />
          <circle cx={cx} cy={cy} r="6" fill={c} />
          <circle cx={cx} cy={cy} r="2.4" fill={palette.flowerCenter} />
        </g>
      ))}
    </svg>
  );
}
