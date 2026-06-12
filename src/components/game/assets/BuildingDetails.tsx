import { palette, shade, tint } from './palette';

/** 삼각 지붕 위에 슬레이트(기와) 줄무늬를 그리는 헬퍼 */
export function ShingleRows({
  apex,
  left,
  right,
  color,
  rows = 4,
}: {
  apex: [number, number];
  left: [number, number];
  right: [number, number];
  color: string;
  rows?: number;
}) {
  const lines = [];
  for (let i = 1; i <= rows; i++) {
    const t = i / (rows + 1);
    const lx = left[0] + (apex[0] - left[0]) * t;
    const ly = left[1] + (apex[1] - left[1]) * t;
    const rx = right[0] + (apex[0] - right[0]) * t;
    const ry = right[1] + (apex[1] - right[1]) * t;
    lines.push(
      <line
        key={i}
        x1={lx}
        y1={ly}
        x2={rx}
        y2={ry}
        stroke={i % 2 === 0 ? shade(color, 0.22) : tint(color, 0.12)}
        strokeWidth="1.4"
        opacity="0.5"
      />
    );
  }
  return <>{lines}</>;
}

/** 벽면에 가로 판자 줄무늬 텍스처를 그리는 헬퍼 */
export function PlankLines({
  x,
  y,
  width,
  height,
  color,
  gap = 8,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  gap?: number;
}) {
  const lines = [];
  for (let cy = y + gap; cy < y + height; cy += gap) {
    lines.push(
      <line key={cy} x1={x} y1={cy} x2={x + width} y2={cy} stroke={shade(color, 0.1)} strokeWidth="1" opacity="0.35" />
    );
  }
  return <>{lines}</>;
}

/** 십자 창틀 + 유리 하이라이트가 있는 창문 */
export function CrossWindow({ x, y, size, frame }: { x: number; y: number; size: number; frame?: string }) {
  const f = frame ?? palette.woodDark;
  return (
    <g>
      <rect x={x} y={y} width={size} height={size} rx="2" fill={tint('#BFE3F5', 0.25)} stroke={f} strokeWidth="2.5" />
      <path d={`M${x} ${y} h${size} v${size * 0.42} L${x} ${y} Z`} fill="#FFFFFF" opacity="0.25" />
      <line x1={x + size / 2} y1={y} x2={x + size / 2} y2={y + size} stroke={f} strokeWidth="1.6" />
      <line x1={x} y1={y + size / 2} x2={x + size} y2={y + size / 2} stroke={f} strokeWidth="1.6" />
    </g>
  );
}
