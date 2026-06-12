import { palette } from './palette';

/** 벤치 — 공원/마을에 배치되는 나무 벤치 */
export default function BenchObject({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="22" width="84" height="9" rx="3" fill={palette.wood} />
      <rect x="8" y="42" width="84" height="9" rx="3" fill={palette.wood} />
      <rect x="14" y="12" width="9" height="14" rx="2" fill={palette.woodDark} />
      <rect x="77" y="12" width="9" height="14" rx="2" fill={palette.woodDark} />
      <rect x="14" y="51" width="9" height="29" rx="2" fill={palette.woodDark} />
      <rect x="77" y="51" width="9" height="29" rx="2" fill={palette.woodDark} />
    </svg>
  );
}
