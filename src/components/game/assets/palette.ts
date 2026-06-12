/** hex 색상을 비율만큼 어둡게 (그림자 면) */
export function shade(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** hex 색상을 비율만큼 밝게 (광원 면 하이라이트) */
export function tint(hex: string, amount = 0.18): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${[nr, ng, nb].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** 생활 시뮬레이션 게임 톤의 공용 색상 팔레트 */
export const palette = {
  grassLight: '#A8E58E',
  grassMid: '#8FD16B',
  grassDark: '#6FB856',
  dirt: '#E8CB9B',
  dirtEdge: '#CDA76E',
  trunk: '#9C6438',
  trunkDark: '#7A4D2A',
  leafLight: '#84D26E',
  leafMid: '#5FAE4E',
  leafDark: '#4A8F3E',
  pineLight: '#6CBE5C',
  pineMid: '#4F9E52',
  pineDark: '#3E8141',
  flowerPink: '#FF9FBC',
  flowerYellow: '#FFD66B',
  flowerPurple: '#C7A6FF',
  flowerWhite: '#FFFFFF',
  flowerCenter: '#FFE69A',
  wood: '#D9A66C',
  woodDark: '#B8854E',
  stone: '#E3DDD0',
  stoneDark: '#C9C1B2',
  water: '#8FD0EE',
  waterDeep: '#6BB6DE',
  roofRed: '#E2664E',
  roofRedShade: '#C9503A',
  roofBrown: '#9C6F4E',
  roofBrownShade: '#7E5A3E',
  roofBlue: '#6F8FCB',
  roofBlueShade: '#5A76AD',
  roofGreen: '#6FAE6E',
  roofGreenShade: '#578F58',
  wallCream: '#FFF6E5',
  wallCreamShade: '#F0E2C8',
  ink: '#3A2C20',
};
