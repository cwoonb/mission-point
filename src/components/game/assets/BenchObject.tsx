import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

/** 벤치 — 공원/마을에 배치되는 나무 벤치, 판자 결 + 그림자 */
export default function BenchObject({ size = 44 }: { size?: number }) {
  const light = tint(palette.wood, 0.18);
  const dark = palette.woodDark;
  return (
    <svg width={size} height={size} viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={84} rx={40} ry={6} />
      {/* 등받이 */}
      <rect x="8" y="20" width="84" height="10" rx="3" fill={palette.wood} />
      <rect x="8" y="20" width="84" height="3" fill={light} opacity="0.7" />
      <rect x="8" y="27" width="84" height="2" fill={dark} opacity="0.3" />
      {/* 앉는 판 */}
      <rect x="8" y="42" width="84" height="10" rx="3" fill={palette.wood} />
      <rect x="8" y="42" width="84" height="3" fill={light} opacity="0.7" />
      <rect x="8" y="49" width="84" height="2" fill={dark} opacity="0.3" />
      {/* 다리 */}
      <rect x="14" y="12" width="9" height="14" rx="2" fill={dark} />
      <rect x="77" y="12" width="9" height="14" rx="2" fill={dark} />
      <rect x="14" y="52" width="9" height="29" rx="2" fill={dark} />
      <rect x="77" y="52" width="9" height="29" rx="2" fill={dark} />
      <rect x="14" y="52" width="3" height="29" fill={shade(dark, 0.2)} opacity="0.5" />
      <rect x="77" y="52" width="3" height="29" fill={shade(dark, 0.2)} opacity="0.5" />
    </svg>
  );
}
