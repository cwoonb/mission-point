import { palette, shade, tint } from './palette';

let uid = 0;

interface GroundFieldProps {
  /** 화면 하단부터 차지하는 비율 (%). 100이면 전체를 덮는다 */
  heightPct?: number;
  className?: string;
}

/** 화면 하단을 덮는 잔디 텍스처 — 물결 가장자리 + 잔디 패턴 + 얼룩 패치 */
export default function GroundField({ heightPct = 100, className = '' }: GroundFieldProps) {
  const id = `grass-${uid++}`;
  const dark = shade(palette.grassMid, 0.18);
  const light = tint(palette.grassLight, 0.25);
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
          <stop offset="55%" stopColor={palette.grassMid} />
          <stop offset="100%" stopColor={palette.grassDark} />
        </linearGradient>
        <pattern id={`${id}-tuft`} width="9" height="9" patternUnits="userSpaceOnUse">
          <path d="M1.5 9 Q1.8 5.5 2.6 8.2" stroke={dark} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M4 9 Q4.6 4.8 5.6 8.4" stroke={light} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.55" />
          <path d="M6.8 9 Q7.2 5.6 8 8.3" stroke={dark} strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M0.5 9 Q1 6.4 1.8 8.6" stroke={light} strokeWidth="0.4" fill="none" strokeLinecap="round" opacity="0.4" />
        </pattern>
      </defs>
      {/* 물결치는 잔디 가장자리 */}
      <path
        d="M0 6 Q8 2 16 5 T34 4 T52 6 T70 3 T88 5 T100 4 L100 100 L0 100 Z"
        fill={`url(#${id}-grad)`}
      />
      <path
        d="M0 6 Q8 2 16 5 T34 4 T52 6 T70 3 T88 5 T100 4 L100 100 L0 100 Z"
        fill={`url(#${id}-tuft)`}
      />
      {/* 얼룩 패치 — 색감에 입체감을 더하는 부드러운 그라데이션 덩어리 */}
      <ellipse cx="18" cy="38" rx="16" ry="9" fill={light} opacity="0.18" />
      <ellipse cx="74" cy="62" rx="20" ry="11" fill={dark} opacity="0.16" />
      <ellipse cx="46" cy="82" rx="24" ry="13" fill={light} opacity="0.14" />
      <ellipse cx="90" cy="22" rx="14" ry="8" fill={dark} opacity="0.14" />
    </svg>
  );
}
