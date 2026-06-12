import { shade, tint } from './palette';
import GroundShadow from './Shadow';

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

/** 마을 동물 주민 — 조류 타입 SVG (🐧🦉 대응), 2단 명암 + 그림자 + 큰 눈 */
export default function BirdResident({ species, size = 40 }: BirdResidentProps) {
  const c = CONFIG[species];
  const dark = shade(c.body, 0.15);
  const light = tint(c.body, 0.2);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={94} rx={26} ry={5} opacity={0.18} />
      <ellipse cx="50" cy="58" rx="30" ry="34" fill={c.body} />
      <ellipse cx="50" cy="74" rx="26" ry="16" fill={dark} opacity="0.3" />
      <ellipse cx="50" cy="64" rx="18" ry="22" fill={c.belly} />
      <ellipse cx="28" cy="50" rx="9" ry="16" fill={c.wing} />
      <ellipse cx="72" cy="50" rx="9" ry="16" fill={c.wing} />
      <ellipse cx="72" cy="52" rx="4" ry="11" fill={shade(c.wing, 0.2)} opacity="0.4" />
      {species === 'owl' && (
        <>
          <circle cx="34" cy="18" r="10" fill={c.wing} />
          <circle cx="66" cy="18" r="10" fill={c.wing} />
        </>
      )}
      <circle cx="50" cy="34" r="22" fill={c.body} />
      <ellipse cx="40" cy="26" rx="13" ry="9" fill={light} opacity="0.5" />
      <circle cx="38" cy="32" r="8" fill="#fff" />
      <circle cx="62" cy="32" r="8" fill="#fff" />
      <circle cx="38" cy="32" r="3.5" fill="#3A2C20" />
      <circle cx="62" cy="32" r="3.5" fill="#3A2C20" />
      <circle cx="39.3" cy="30.6" r="1.2" fill="#FFFFFF" />
      <circle cx="63.3" cy="30.6" r="1.2" fill="#FFFFFF" />
      <ellipse cx="32" cy="40" rx="4" ry="2.4" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="68" cy="40" rx="4" ry="2.4" fill="#FDA4AF" opacity="0.5" />
      <path d="M44 40 L56 40 L50 48 Z" fill={c.beak} />
      <path d="M44 40 L56 40 L50 44 Z" fill={tint(c.beak, 0.2)} opacity="0.6" />
    </svg>
  );
}
