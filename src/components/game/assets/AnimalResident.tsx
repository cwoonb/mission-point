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
  switch (shape) {
    case 'pointy':
      return (
        <>
          <path d="M22 22 L34 4 L42 24 Z" fill={color} />
          <path d="M78 22 L66 4 L58 24 Z" fill={color} />
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
        </>
      );
    case 'wide':
      return (
        <>
          <ellipse cx="22" cy="30" rx="10" ry="16" fill={color} />
          <ellipse cx="78" cy="30" rx="10" ry="16" fill={color} />
        </>
      );
    default:
      return (
        <>
          <circle cx="30" cy="14" r="11" fill={color} />
          <circle cx="70" cy="14" r="11" fill={color} />
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

/** 마을 동물 주민 — 포유류 타입 SVG (🐰🐿️🦫🦊🐱🐶🐻🐼 대응) */
export default function AnimalResident({ species, size = 40 }: AnimalResidentProps) {
  const c = CONFIG[species];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="70" rx="28" ry="22" fill={c.body} />
      <ellipse cx="50" cy="76" rx="15" ry="11" fill={c.belly} />
      <Ears shape={c.ear} color={c.body} accent={c.accent} />
      <circle cx="50" cy="38" r="26" fill={c.body} />
      {species === 'fox' && <ellipse cx="50" cy="44" rx="15" ry="11" fill={c.belly} />}
      {species === 'panda' && (
        <>
          <ellipse cx="38" cy="36" rx="9" ry="11" fill={c.accent} transform="rotate(-12 38 36)" />
          <ellipse cx="62" cy="36" rx="9" ry="11" fill={c.accent} transform="rotate(12 62 36)" />
          <circle cx="38" cy="37" r="4" fill="#fff" />
          <circle cx="62" cy="37" r="4" fill="#fff" />
        </>
      )}
      <circle cx="40" cy="38" r="3" fill="#3A2C20" />
      <circle cx="60" cy="38" r="3" fill="#3A2C20" />
      <ellipse cx="50" cy="47" rx="4.5" ry="3" fill="#3A2C20" opacity="0.85" />
    </svg>
  );
}
