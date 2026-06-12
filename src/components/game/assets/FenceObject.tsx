import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

/** 울타리 — 나무 펜스 한 구간, 기둥 캡 + 나뭇결 텍스처 + 그림자 */
export default function FenceObject({ size = 44 }: { size?: number }) {
  const postLight = tint(palette.wood, 0.15);
  const postDark = palette.woodDark;
  const railShade = shade(palette.woodDark, 0.15);
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={61} rx={42} ry={4} />
      {/* 가로 레일 */}
      <rect x="2" y="19" width="96" height="7" rx="2" fill={postDark} />
      <rect x="2" y="19" width="96" height="2.5" fill={railShade} opacity="0.5" />
      <rect x="2" y="38" width="96" height="7" rx="2" fill={postDark} />
      <rect x="2" y="38" width="96" height="2.5" fill={railShade} opacity="0.5" />
      {/* 기둥 */}
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 4 + i * 20;
        return (
          <g key={i}>
            <rect x={x} y="8" width="12" height="50" rx="2" fill={palette.wood} />
            <rect x={x} y="8" width="4" height="50" fill={postLight} opacity="0.6" />
            <rect x={x + 8} y="8" width="3" height="50" fill={postDark} opacity="0.35" />
            <path d={`M${x} 8 L${x + 6} 2 L${x + 12} 8 Z`} fill={postDark} />
            {/* 나뭇결 */}
            <path d={`M${x + 2} 18 q4 4 0 10`} stroke={postDark} strokeWidth="0.8" fill="none" opacity="0.3" />
            <path d={`M${x + 8} 30 q-4 5 0 12`} stroke={postDark} strokeWidth="0.8" fill="none" opacity="0.25" />
          </g>
        );
      })}
    </svg>
  );
}
