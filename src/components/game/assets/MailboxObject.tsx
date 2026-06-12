import { palette, shade, tint } from './palette';
import GroundShadow from './Shadow';

/** 우체통 — 2단 명암 + 그림자 */
export default function MailboxObject({ size = 32 }: { size?: number }) {
  const light = tint(palette.roofRed, 0.2);
  const dark = palette.roofRedShade;
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={30} cy={81} rx={16} ry={3.4} />
      <rect x="25" y="36" width="10" height="44" rx="2" fill={palette.woodDark} />
      <rect x="25" y="36" width="3" height="44" fill={shade(palette.woodDark, 0.2)} opacity="0.5" />
      <rect x="6" y="6" width="48" height="32" rx="16" fill={palette.roofRed} />
      <rect x="6" y="6" width="48" height="14" rx="14" fill={light} opacity="0.55" />
      <rect x="6" y="20" width="48" height="18" rx="9" fill={dark} opacity="0.5" />
      <rect x="44" y="10" width="10" height="6" rx="1" fill={palette.flowerYellow} />
      <ellipse cx="30" cy="22" rx="16" ry="3" fill="#FFFFFF" opacity="0.15" />
    </svg>
  );
}
