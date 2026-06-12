import { palette } from './palette';

/** 울타리 — 나무 펜스 한 구간 */
export default function FenceObject({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="18" width="96" height="7" rx="2" fill={palette.woodDark} />
      <rect x="2" y="36" width="96" height="7" rx="2" fill={palette.woodDark} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={4 + i * 20} y="6" width="11" height="48" rx="3" fill={palette.wood} />
      ))}
    </svg>
  );
}
