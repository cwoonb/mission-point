/** 모든 지상 오브젝트 발밑에 쓰는 반투명 타원 그림자 (좌상단 광원 기준 공통 톤) */
export default function GroundShadow({ cx, cy, rx, ry, opacity = 0.2 }: { cx: number; cy: number; rx: number; ry?: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry ?? rx * 0.32} fill="#4A3526" opacity={opacity} />;
}
