import { palette, shade, tint } from './palette';

let uid = 0;

interface PathRibbonProps {
  /** viewBox 0 0 100 100 좌표계의 path d 속성 */
  d: string;
  /** 길 너비 (viewBox 단위) */
  width?: number;
  className?: string;
}

/** 흙길 — 풀과의 경계가 자연스럽게 풀리는 비네트 + 자갈/얼룩 텍스처가 있는 SVG 길 */
export default function PathRibbon({ d, width = 14, className = '' }: PathRibbonProps) {
  const id = `path-${uid++}`;
  const edge = shade(palette.dirtEdge, 0.08);
  const fleck = shade(palette.dirt, 0.2);
  const highlight = tint(palette.dirt, 0.25);
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id={`${id}-tex`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="transparent" />
          <circle cx="1.4" cy="1.6" r="0.5" fill={fleck} opacity="0.5" />
          <circle cx="4.2" cy="3.6" r="0.6" fill={highlight} opacity="0.4" />
          <circle cx="2.6" cy="4.8" r="0.4" fill={fleck} opacity="0.4" />
        </pattern>
      </defs>
      {/* 풀과의 경계 — 부드럽게 풀리는 흐린 가장자리 */}
      <path d={d} stroke={edge} strokeWidth={width + 4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      <path d={d} stroke={edge} strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <path d={d} stroke={palette.dirt} strokeWidth={width - 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={`url(#${id}-tex)`} strokeWidth={width - 3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke={highlight} strokeWidth={Math.max(1.5, (width - 3) * 0.22)} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
    </svg>
  );
}
