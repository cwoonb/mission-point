export type BirdSpecies = 'penguin' | 'owl';

interface BirdConfig {
  body: string;
  belly: string;
  beak: string;
  wing: string;
}

const CONFIG: Record<BirdSpecies, BirdConfig> = {
  penguin: { body: '#3A3A4A', belly: '#FFFFFF', beak: '#FFB84D', wing: '#2A2A38' },
  owl: { body: '#B08968', belly: '#F5E6D3', beak: '#E8A33D', wing: '#8A6647' },
};

interface BirdResidentProps {
  species: BirdSpecies;
  size?: number;
}

/** 마을 동물 주민 — 조류 타입 SVG (🐧🦉 대응) */
export default function BirdResident({ species, size = 40 }: BirdResidentProps) {
  const c = CONFIG[species];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="58" rx="30" ry="34" fill={c.body} />
      <ellipse cx="50" cy="64" rx="18" ry="22" fill={c.belly} />
      <ellipse cx="28" cy="50" rx="9" ry="16" fill={c.wing} />
      <ellipse cx="72" cy="50" rx="9" ry="16" fill={c.wing} />
      {species === 'owl' && (
        <>
          <circle cx="34" cy="18" r="10" fill={c.wing} />
          <circle cx="66" cy="18" r="10" fill={c.wing} />
        </>
      )}
      <circle cx="50" cy="34" r="22" fill={c.body} />
      <circle cx="38" cy="32" r="8" fill="#fff" />
      <circle cx="62" cy="32" r="8" fill="#fff" />
      <circle cx="38" cy="32" r="3.5" fill="#3A2C20" />
      <circle cx="62" cy="32" r="3.5" fill="#3A2C20" />
      <path d="M44 40 L56 40 L50 48 Z" fill={c.beak} />
    </svg>
  );
}
