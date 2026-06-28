/** 중심(cx, cy), 반지름 r인 4꼭지 별(스파클) path */
export const starPath = (cx: number, cy: number, r: number): string => {
  const o = r * 0.32;
  return [
    `M ${cx} ${cy - r}`,
    `Q ${cx + o} ${cy - o} ${cx + r} ${cy}`,
    `Q ${cx + o} ${cy + o} ${cx} ${cy + r}`,
    `Q ${cx - o} ${cy + o} ${cx - r} ${cy}`,
    `Q ${cx - o} ${cy - o} ${cx} ${cy - r}`,
    'Z',
  ].join(' ');
};
