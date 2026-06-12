import { palette } from './palette';

let uid = 0;

interface GroundFieldProps {
  /** 화면 하단부터 차지하는 비율 (%). 100이면 전체를 덮는다 */
  heightPct?: number;
  className?: string;
}

/** 화면 하단을 덮는 잔디 텍스처 (그라데이션 + 풀잎 패턴) */
export default function GroundField({ heightPct = 100, className = '' }: GroundFieldProps) {
  const id = `grass-${uid++}`;
  return (
    <svg
      className={`absolute bottom-0 left-0 right-0 w-full pointer-events-none ${className}`}
      style={{ height: `${heightPct}%` }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.grassLight} />
          <stop offset="100%" stopColor={palette.grassDark} />
        </linearGradient>
        <pattern id={`${id}-tuft`} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M1 7 q0.6 -2.4 1.2 0" stroke={palette.grassDark} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M3.5 7 q0.6 -3 1.2 0" stroke={palette.leafLight} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M5.6 7 q0.6 -2 1.2 0" stroke={palette.grassDark} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill={`url(#${id}-grad)`} />
      <rect width="100" height="100" fill={`url(#${id}-tuft)`} />
    </svg>
  );
}
