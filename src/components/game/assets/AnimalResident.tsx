import { shade, tint } from './palette';
import GroundShadow from './Shadow';

export type MammalSpecies = 'rabbit' | 'squirrel' | 'beaver' | 'fox' | 'cat' | 'dog' | 'bear' | 'panda';

interface MammalConfig {
  body: string;
  belly: string;
  ear: 'round' | 'pointy' | 'tall' | 'wide';
  accent?: string;
}

const CONFIG: Record<MammalSpecies, MammalConfig> = {
  rabbit: { body: '#F5E6D8', belly: '#FFFFFF', ear: 'tall' },
  squirrel: { body: '#C98A52', belly: '#F5E6D8', ear: 'round' },
  beaver: { body: '#8A5A36', belly: '#C98A52', ear: 'round' },
  fox: { body: '#E8884A', belly: '#FFFFFF', ear: 'pointy', accent: '#FFFFFF' },
  cat: { body: '#D9A66C', belly: '#FFF6E5', ear: 'pointy' },
  dog: { body: '#C98A52', belly: '#FFF6E5', ear: 'wide' },
  bear: { body: '#8A5A36', belly: '#C98A52', ear: 'round' },
  panda: { body: '#FFFFFF', belly: '#FFFFFF', ear: 'round', accent: '#3A3A3A' },
};

function Ears({ shape, color, accent }: { shape: MammalConfig['ear']; color: string; accent?: string }) {
  const dark = shade(color, 0.15);
  switch (shape) {
    case 'pointy':
      return (
        <>
          <path d="M22 22 L34 4 L42 24 Z" fill={color} />
          <path d="M78 22 L66 4 L58 24 Z" fill={color} />
          <path d="M22 22 L34 4 L38 20 Z" fill={dark} opacity="0.3" />
          {accent && (
            <>
              <path d="M26 20 L34 10 L38 22 Z" fill={accent} />
              <path d="M74 20 L66 10 L62 22 Z" fill={accent} />
            </>
          )}
        </>
      );
    case 'tall':
      return (
        <>
          <ellipse cx="34" cy="4" rx="7" ry="18" fill={color} transform="rotate(-12 34 4)" />
          <ellipse cx="66" cy="4" rx="7" ry="18" fill={color} transform="rotate(12 66 4)" />
          <ellipse cx="34" cy="4" rx="3" ry="13" fill="#FFD7E2" opacity="0.6" transform="rotate(-12 34 4)" />
          <ellipse cx="66" cy="4" rx="3" ry="13" fill="#FFD7E2" opacity="0.6" transform="rotate(12 66 4)" />
          <ellipse cx="37" cy="2" rx="2.4" ry="10" fill={dark} opacity="0.18" transform="rotate(-12 34 4)" />
        </>
      );
    case 'wide':
      return (
        <>
          <ellipse cx="22" cy="30" rx="10" ry="16" fill={color} />
          <ellipse cx="78" cy="30" rx="10" ry="16" fill={color} />
          <ellipse cx="78" cy="32" rx="5" ry="13" fill={dark} opacity="0.25" />
        </>
      );
    default:
      return (
        <>
          <circle cx="30" cy="14" r="11" fill={color} />
          <circle cx="70" cy="14" r="11" fill={color} />
          <circle cx="73" cy="16" r="6" fill={dark} opacity="0.22" />
          {accent && (
            <>
              <circle cx="30" cy="14" r="6" fill={accent} />
              <circle cx="70" cy="14" r="6" fill={accent} />
            </>
          )}
        </>
      );
  }
}

interface AnimalResidentProps {
  species: MammalSpecies;
  size?: number;
}

/** 마을 동물 주민 — 포유류 타입 SVG (🐰🐿️🦫🦊🐱🐶🐻🐼 대응), 2단 명암 + 그림자 + 큰 눈 */
export default function AnimalResident({ species, size = 40 }: AnimalResidentProps) {
  const c = CONFIG[species];
  const dark = shade(c.body, 0.15);
  const light = tint(c.body, 0.2);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={92} rx={26} ry={5} opacity={0.18} />
      <ellipse cx="50" cy="70" rx="28" ry="22" fill={c.body} />
      <ellipse cx="50" cy="78" rx="24" ry="12" fill={dark} opacity="0.3" />
      <ellipse cx="50" cy="76" rx="15" ry="11" fill={c.belly} />
      <Ears shape={c.ear} color={c.body} accent={c.accent} />
      <circle cx="50" cy="38" r="26" fill={c.body} />
      <ellipse cx="40" cy="28" rx="15" ry="10" fill={light} opacity="0.5" />
      <ellipse cx="60" cy="46" rx="16" ry="11" fill={dark} opacity="0.3" />
      {species === 'fox' && <ellipse cx="50" cy="44" rx="15" ry="11" fill={c.belly} />}
      {species === 'panda' && (
        <>
          <ellipse cx="38" cy="36" rx="9" ry="11" fill={c.accent} transform="rotate(-12 38 36)" />
          <ellipse cx="62" cy="36" rx="9" ry="11" fill={c.accent} transform="rotate(12 62 36)" />
          <circle cx="38" cy="37" r="4" fill="#fff" />
          <circle cx="62" cy="37" r="4" fill="#fff" />
        </>
      )}
      {/* 볼터치 */}
      <ellipse cx="32" cy="44" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.55" />
      <ellipse cx="68" cy="44" rx="4.5" ry="2.8" fill="#FDA4AF" opacity="0.55" />
      {/* 큰 눈 + 반짝임 */}
      <circle cx="40" cy="38" r="3.6" fill="#3A2C20" />
      <circle cx="60" cy="38" r="3.6" fill="#3A2C20" />
      <circle cx="41.2" cy="36.6" r="1.2" fill="#FFFFFF" />
      <circle cx="61.2" cy="36.6" r="1.2" fill="#FFFFFF" />
      <ellipse cx="50" cy="47" rx="4.5" ry="3" fill="#3A2C20" opacity="0.85" />
    </svg>
  );
}
