import { palette } from './palette';

/** 우체통 */
export default function MailboxObject({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 60 84" xmlns="http://www.w3.org/2000/svg">
      <rect x="25" y="36" width="10" height="44" rx="2" fill={palette.woodDark} />
      <ellipse cx="30" cy="80" rx="14" ry="3" fill={palette.trunkDark} opacity="0.25" />
      <rect x="6" y="6" width="48" height="32" rx="16" fill={palette.roofRed} />
      <rect x="6" y="20" width="48" height="18" rx="9" fill={palette.roofRedShade} opacity="0.5" />
      <rect x="44" y="10" width="10" height="6" rx="1" fill={palette.flowerYellow} />
    </svg>
  );
}
