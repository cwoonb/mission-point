import { palette } from './palette';

interface PathRibbonProps {
  /** viewBox 0 0 100 100 좌표계의 path d 속성 */
  d: string;
  /** 길 너비 (viewBox 단위) */
  width?: number;
  className?: string;
}

/** 흙길 — 두 겹의 stroke로 부드러운 가장자리를 표현한 SVG 길 */
export default function PathRibbon({ d, width = 14, className = '' }: PathRibbonProps) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={d} stroke={palette.dirtEdge} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
      <path d={d} stroke={palette.dirt} strokeWidth={width - 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
