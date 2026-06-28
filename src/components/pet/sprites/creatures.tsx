import type { PetSpecies } from '../../../types';
import type { ShapeProps, SpeciesPalette } from './types';
import { starPath } from './starPath';

/** 종별 기본 색상 팔레트 */
export const SPECIES_PALETTE: Record<PetSpecies, SpeciesPalette> = {
  dog: { body: '#D9A66C', belly: '#FFF6E5', accent: '#B8854E' },
  cat: { body: '#F2B880', belly: '#FFF6E5', accent: '#E69A5C' },
  rabbit: { body: '#F8EDE3', belly: '#FFFFFF', accent: '#FFC9DA' },
  chick: { body: '#FFE17A', belly: '#FFFBE8', accent: '#FF9F43' },
  dino: { body: '#8FD16B', belly: '#E3F5D6', accent: '#5FAE4E' },
  fox: { body: '#F4955C', belly: '#FFF6E5', accent: '#C96A36' },
  slime: { body: '#8FE3C8', belly: '#E8FFF7', accent: '#4FBF9A' },
  unicorn: { body: '#F6EBFF', belly: '#FFFFFF', accent: '#C9A6FF', extra: ['#FFB3C6', '#B3E5FC', '#FFE9A8'] },
  dragon: { body: '#7FD9A0', belly: '#E8FFF1', accent: '#4FAE6E', extra: ['#5FCB7E'] },
  phoenix: { body: '#FF9466', belly: '#FFE3CC', accent: '#FFC23C', extra: ['#FFD54F', '#FF6F3C'] },
};

/** 꼬리/날개/등장식 등 — 몸 뒤쪽에 그려지는 종별 장식 */
export function SpeciesBack({ species, p, palette, dark }: ShapeProps & { species: PetSpecies }) {
  switch (species) {
    case 'dog':
      return (
        <ellipse
          cx={60 + p.bodyRx * 0.95}
          cy={p.bodyCy + p.bodyRy * 0.15}
          rx={p.headR * 0.22}
          ry={p.headR * 0.4}
          fill={palette.body}
          transform={`rotate(35 ${60 + p.bodyRx * 0.95} ${p.bodyCy + p.bodyRy * 0.15})`}
        />
      );
    case 'cat':
      return (
        <path
          d={`M ${60 + p.bodyRx * 0.75} ${p.bodyCy + p.bodyRy * 0.2} Q ${60 + p.bodyRx * 1.7} ${p.bodyCy + p.bodyRy * 0.1} ${60 + p.bodyRx * 1.55} ${p.bodyCy - p.bodyRy * 1.1}`}
          stroke={palette.body}
          strokeWidth={p.headR * 0.32}
          strokeLinecap="round"
          fill="none"
        />
      );
    case 'rabbit':
      return <circle cx={60 + p.bodyRx * 0.85} cy={p.bodyCy + p.bodyRy * 0.45} r={p.headR * 0.32} fill={palette.belly} />;
    case 'chick':
      return (
        <>
          <ellipse
            cx={60 - p.bodyRx * 0.85}
            cy={p.bodyCy - p.bodyRy * 0.05}
            rx={p.headR * 0.4}
            ry={p.headR * 0.24}
            fill={dark}
            opacity="0.5"
            transform={`rotate(-20 ${60 - p.bodyRx * 0.85} ${p.bodyCy - p.bodyRy * 0.05})`}
          />
          <ellipse
            cx={60 + p.bodyRx * 0.85}
            cy={p.bodyCy - p.bodyRy * 0.05}
            rx={p.headR * 0.4}
            ry={p.headR * 0.24}
            fill={dark}
            opacity="0.5"
            transform={`rotate(20 ${60 + p.bodyRx * 0.85} ${p.bodyCy - p.bodyRy * 0.05})`}
          />
        </>
      );
    case 'dino':
      return (
        <g fill={palette.accent}>
          <path d={`M ${60 - p.headR * 0.5} ${p.headCy - p.headR * 0.95} l 7 -12 7 12 Z`} />
          <path d={`M ${60 - p.headR * 0.1} ${p.bodyCy - p.bodyRy * 0.95} l 8 -13 8 13 Z`} />
          <path d={`M ${60 + p.headR * 0.4} ${p.bodyCy - p.bodyRy * 0.6} l 8 -11 7 11 Z`} />
          <path
            d={`M ${60 + p.bodyRx * 0.8} ${p.bodyCy + p.bodyRy * 0.4} Q ${60 + p.bodyRx * 1.6} ${p.bodyCy + p.bodyRy * 0.7} ${60 + p.bodyRx * 1.5} ${p.bodyCy - p.bodyRy * 0.3}`}
            fill={palette.body}
            stroke="none"
          />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path
            d={`M ${60 + p.bodyRx * 0.8} ${p.bodyCy + p.bodyRy * 0.3} Q ${60 + p.bodyRx * 1.9} ${p.bodyCy + p.bodyRy * 0.2} ${60 + p.bodyRx * 1.7} ${p.bodyCy - p.bodyRy * 1.2}`}
            stroke={palette.body}
            strokeWidth={p.headR * 0.5}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx={60 + p.bodyRx * 1.7} cy={p.bodyCy - p.bodyRy * 1.2} r={p.headR * 0.28} fill={palette.belly} />
        </g>
      );
    case 'slime':
      return (
        <g fill={palette.belly} opacity="0.7">
          <circle cx={60 - p.bodyRx * 1.25} cy={p.bodyCy - p.bodyRy * 0.7} r={p.headR * 0.16} />
          <circle cx={60 + p.bodyRx * 1.2} cy={p.bodyCy - p.bodyRy * 1.05} r={p.headR * 0.11} />
        </g>
      );
    case 'unicorn': {
      const extra = palette.extra ?? ['#FFB3C6', '#B3E5FC', '#FFE9A8'];
      return (
        <g fill="none" strokeLinecap="round">
          <path
            d={`M ${60 + p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.1} Q ${60 + p.bodyRx * 1.6} ${p.bodyCy - p.bodyRy * 0.2} ${60 + p.bodyRx * 1.3} ${p.bodyCy - p.bodyRy * 1.3}`}
            stroke={extra[0]}
            strokeWidth={p.headR * 0.22}
          />
          <path
            d={`M ${60 + p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.3} Q ${60 + p.bodyRx * 1.7} ${p.bodyCy + p.bodyRy * 0.1} ${60 + p.bodyRx * 1.5} ${p.bodyCy - p.bodyRy * 1.0}`}
            stroke={extra[1]}
            strokeWidth={p.headR * 0.2}
          />
          <path
            d={`M ${60 + p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.5} Q ${60 + p.bodyRx * 1.5} ${p.bodyCy + p.bodyRy * 0.45} ${60 + p.bodyRx * 1.4} ${p.bodyCy - p.bodyRy * 0.5}`}
            stroke={extra[2]}
            strokeWidth={p.headR * 0.18}
          />
        </g>
      );
    }
    case 'dragon': {
      const extra = palette.extra ?? ['#5FCB7E'];
      return (
        <g>
          <path
            d={`M ${60 - p.bodyRx * 0.6} ${p.bodyCy - p.bodyRy * 0.3} Q ${60 - p.bodyRx * 1.8} ${p.bodyCy - p.bodyRy * 0.6} ${60 - p.bodyRx * 1.5} ${p.bodyCy + p.bodyRy * 0.4} Q ${60 - p.bodyRx * 1.0} ${p.bodyCy + p.bodyRy * 0.1} ${60 - p.bodyRx * 0.6} ${p.bodyCy + p.bodyRy * 0.3} Z`}
            fill={extra[0]}
            opacity="0.85"
          />
          <path
            d={`M ${60 + p.bodyRx * 0.6} ${p.bodyCy - p.bodyRy * 0.3} Q ${60 + p.bodyRx * 1.8} ${p.bodyCy - p.bodyRy * 0.6} ${60 + p.bodyRx * 1.5} ${p.bodyCy + p.bodyRy * 0.4} Q ${60 + p.bodyRx * 1.0} ${p.bodyCy + p.bodyRy * 0.1} ${60 + p.bodyRx * 0.6} ${p.bodyCy + p.bodyRy * 0.3} Z`}
            fill={extra[0]}
            opacity="0.85"
          />
          <path
            d={`M ${60 + p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.6} Q ${60 + p.bodyRx * 1.5} ${p.bodyCy + p.bodyRy * 1.0} ${60 + p.bodyRx * 1.25} ${p.bodyCy + p.bodyRy * 1.5}`}
            stroke={palette.body}
            strokeWidth={p.headR * 0.26}
            strokeLinecap="round"
            fill="none"
          />
          <path d={`M ${60 - p.headR * 0.1} ${p.bodyCy - p.bodyRy * 0.95} l 7 -11 7 11 Z`} fill={extra[0]} />
        </g>
      );
    }
    case 'phoenix': {
      const extra = palette.extra ?? ['#FFD54F', '#FF6F3C'];
      return (
        <g>
          <path
            d={`M ${60 - p.bodyRx * 0.7} ${p.bodyCy - p.bodyRy * 0.2} Q ${60 - p.bodyRx * 2.0} ${p.bodyCy - p.bodyRy * 0.4} ${60 - p.bodyRx * 1.6} ${p.bodyCy + p.bodyRy * 0.6} Q ${60 - p.bodyRx * 1.0} ${p.bodyCy + p.bodyRy * 0.2} ${60 - p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.3} Z`}
            fill={extra[0]}
          />
          <path
            d={`M ${60 + p.bodyRx * 0.7} ${p.bodyCy - p.bodyRy * 0.2} Q ${60 + p.bodyRx * 2.0} ${p.bodyCy - p.bodyRy * 0.4} ${60 + p.bodyRx * 1.6} ${p.bodyCy + p.bodyRy * 0.6} Q ${60 + p.bodyRx * 1.0} ${p.bodyCy + p.bodyRy * 0.2} ${60 + p.bodyRx * 0.7} ${p.bodyCy + p.bodyRy * 0.3} Z`}
            fill={extra[0]}
          />
          <path
            d={`M 60 ${p.bodyCy + p.bodyRy * 0.8} l ${-p.headR * 0.3} ${p.headR * 0.9} l ${p.headR * 0.3} ${-p.headR * 0.3} l ${p.headR * 0.3} ${p.headR * 0.3} Z`}
            fill={extra[1]}
          />
        </g>
      );
    }
    default:
      return null;
  }
}

/** 귀/머리장식/뿔 등 — 머리 위에 그려지는 종별 장식 (머리 원보다 먼저 그려짐) */
export function SpeciesEars({ species, p, palette, dark }: ShapeProps & { species: PetSpecies }) {
  const baseY = p.headCy - p.headR * 0.55;
  switch (species) {
    case 'dog':
      return (
        <g fill={palette.body}>
          <ellipse cx={60 - p.headR * 0.95} cy={p.headCy + p.headR * 0.05} rx={p.headR * 0.32} ry={p.headR * 0.55} />
          <ellipse cx={60 + p.headR * 0.95} cy={p.headCy + p.headR * 0.05} rx={p.headR * 0.32} ry={p.headR * 0.55} />
          <ellipse cx={60 + p.headR * 0.98} cy={p.headCy + p.headR * 0.12} rx={p.headR * 0.16} ry={p.headR * 0.42} fill={dark} opacity="0.2" />
        </g>
      );
    case 'cat':
      return (
        <g fill={palette.body}>
          <path d={`M ${60 - p.headR * 0.85} ${baseY} L ${60 - p.headR * 1.25} ${baseY - p.headR * 1.05} L ${60 - p.headR * 0.2} ${baseY - p.headR * 0.15} Z`} />
          <path d={`M ${60 + p.headR * 0.85} ${baseY} L ${60 + p.headR * 1.25} ${baseY - p.headR * 1.05} L ${60 + p.headR * 0.2} ${baseY - p.headR * 0.15} Z`} />
          <path d={`M ${60 + p.headR * 0.85} ${baseY} L ${60 + p.headR * 1.18} ${baseY - p.headR * 0.85} L ${60 + p.headR * 0.45} ${baseY - p.headR * 0.2} Z`} fill={dark} opacity="0.25" />
        </g>
      );
    case 'rabbit':
      return (
        <g fill={palette.body}>
          <ellipse cx={60 - p.headR * 0.45} cy={baseY - p.headR * 0.6} rx={p.headR * 0.24} ry={p.headR * 0.7} transform={`rotate(-10 ${60 - p.headR * 0.45} ${baseY - p.headR * 0.6})`} />
          <ellipse cx={60 + p.headR * 0.45} cy={baseY - p.headR * 0.6} rx={p.headR * 0.24} ry={p.headR * 0.7} transform={`rotate(10 ${60 + p.headR * 0.45} ${baseY - p.headR * 0.6})`} />
          <ellipse cx={60 - p.headR * 0.45} cy={baseY - p.headR * 0.55} rx={p.headR * 0.1} ry={p.headR * 0.5} fill="#FFD7E2" opacity="0.7" transform={`rotate(-10 ${60 - p.headR * 0.45} ${baseY - p.headR * 0.55})`} />
          <ellipse cx={60 + p.headR * 0.45} cy={baseY - p.headR * 0.55} rx={p.headR * 0.1} ry={p.headR * 0.5} fill="#FFD7E2" opacity="0.7" transform={`rotate(10 ${60 + p.headR * 0.45} ${baseY - p.headR * 0.55})`} />
        </g>
      );
    case 'chick':
      return (
        <g fill={palette.accent}>
          <path d={`M ${60 - p.headR * 0.18} ${p.headCy - p.headR * 0.95} q 4 -12 8 0 q -4 4 -8 0 Z`} />
        </g>
      );
    case 'dino':
      return (
        <g fill={palette.accent}>
          <path d={`M ${60 - p.headR * 0.3} ${p.headCy - p.headR * 0.92} l 7 -11 6 11 Z`} />
          <path d={`M ${60 + p.headR * 0.18} ${p.headCy - p.headR * 0.98} l 7 -12 6 12 Z`} />
        </g>
      );
    case 'fox':
      return (
        <g>
          <path d={`M ${60 - p.headR * 0.8} ${baseY} L ${60 - p.headR * 1.3} ${baseY - p.headR * 1.15} L ${60 - p.headR * 0.15} ${baseY - p.headR * 0.1} Z`} fill={palette.body} />
          <path d={`M ${60 + p.headR * 0.8} ${baseY} L ${60 + p.headR * 1.3} ${baseY - p.headR * 1.15} L ${60 + p.headR * 0.15} ${baseY - p.headR * 0.1} Z`} fill={palette.body} />
          <path d={`M ${60 - p.headR * 1.18} ${baseY - p.headR * 0.85} L ${60 - p.headR * 1.3} ${baseY - p.headR * 1.15} L ${60 - p.headR * 0.95} ${baseY - p.headR * 0.55} Z`} fill={dark} opacity="0.5" />
          <path d={`M ${60 + p.headR * 1.18} ${baseY - p.headR * 0.85} L ${60 + p.headR * 1.3} ${baseY - p.headR * 1.15} L ${60 + p.headR * 0.95} ${baseY - p.headR * 0.55} Z`} fill={dark} opacity="0.5" />
        </g>
      );
    case 'slime':
      return null;
    case 'unicorn': {
      const extra = palette.extra ?? ['#FFB3C6', '#B3E5FC', '#FFE9A8'];
      return (
        <g>
          <g fill={palette.body}>
            <ellipse cx={60 - p.headR * 0.55} cy={baseY - p.headR * 0.5} rx={p.headR * 0.2} ry={p.headR * 0.55} transform={`rotate(-15 ${60 - p.headR * 0.55} ${baseY - p.headR * 0.5})`} />
            <ellipse cx={60 + p.headR * 0.55} cy={baseY - p.headR * 0.5} rx={p.headR * 0.2} ry={p.headR * 0.55} transform={`rotate(15 ${60 + p.headR * 0.55} ${baseY - p.headR * 0.5})`} />
          </g>
          <path d={`M 60 ${p.headCy - p.headR * 0.95} l ${p.headR * 0.16} ${p.headR * 0.55} l ${-p.headR * 0.32} 0 Z`} fill={extra[2]} stroke={palette.accent} strokeWidth="1" />
        </g>
      );
    }
    case 'dragon': {
      const extra = palette.extra ?? ['#5FCB7E'];
      return (
        <g fill={extra[0]}>
          <path d={`M ${60 - p.headR * 0.4} ${p.headCy - p.headR * 0.9} l 5 -10 5 8 Z`} />
          <path d={`M ${60 + p.headR * 0.4} ${p.headCy - p.headR * 0.9} l 5 -8 5 10 Z`} />
        </g>
      );
    }
    case 'phoenix': {
      const extra = palette.extra ?? ['#FFD54F', '#FF6F3C'];
      return (
        <g fill={extra[1]}>
          <path d={`M ${60 - p.headR * 0.3} ${p.headCy - p.headR * 0.95} q 4 -14 8 0 q -4 5 -8 0 Z`} />
          <path d={`M 60 ${p.headCy - p.headR * 1.05} q 5 -16 9 0 q -4.5 5.5 -9 0 Z`} />
          <path d={`M ${60 + p.headR * 0.3} ${p.headCy - p.headR * 0.95} q 4 -14 8 0 q -4 5 -8 0 Z`} />
        </g>
      );
    }
    default:
      return null;
  }
}

/** 입(부리)/볼 패턴 등 — 얼굴 위에 추가로 그려지는 종별 디테일 (눈/입보다 먼저 그려짐) */
export function SpeciesFace({ species, p, palette }: ShapeProps & { species: PetSpecies }) {
  switch (species) {
    case 'chick':
      return (
        <path
          d={`M 60 ${p.headCy + p.headR * 0.18} l ${p.headR * 0.3} ${p.headR * 0.1} l ${-p.headR * 0.3} ${p.headR * 0.14} Z`}
          fill={palette.accent}
        />
      );
    case 'rabbit':
      return (
        <>
          <line x1={60 - p.headR * 0.7} y1={p.headCy + p.headR * 0.05} x2={60 - p.headR * 0.95} y2={p.headCy - p.headR * 0.02} stroke="#D9C9BC" strokeWidth={p.headR * 0.03} />
          <line x1={60 + p.headR * 0.7} y1={p.headCy + p.headR * 0.05} x2={60 + p.headR * 0.95} y2={p.headCy - p.headR * 0.02} stroke="#D9C9BC" strokeWidth={p.headR * 0.03} />
        </>
      );
    case 'fox':
      return <ellipse cx="60" cy={p.headCy + p.headR * 0.32} rx={p.headR * 0.42} ry={p.headR * 0.3} fill={palette.belly} />;
    case 'unicorn': {
      const extra = palette.extra ?? ['#FFB3C6', '#B3E5FC', '#FFE9A8'];
      return <path d={starPath(60 + p.headR * 0.55, p.headCy - p.headR * 0.4, p.headR * 0.13)} fill={extra[2]} />;
    }
    case 'dragon':
      return (
        <g fill={palette.belly} opacity="0.6">
          <ellipse cx={60 - p.headR * 0.05} cy={p.headCy + p.headR * 0.35} rx={p.headR * 0.12} ry={p.headR * 0.08} />
          <ellipse cx={60 + p.headR * 0.25} cy={p.headCy + p.headR * 0.42} rx={p.headR * 0.1} ry={p.headR * 0.07} />
        </g>
      );
    case 'phoenix': {
      const extra = palette.extra ?? ['#FFD54F', '#FF6F3C'];
      return (
        <path
          d={`M 60 ${p.headCy + p.headR * 0.18} l ${p.headR * 0.32} ${p.headR * 0.1} l ${-p.headR * 0.32} ${p.headR * 0.16} Z`}
          fill={extra[1]}
        />
      );
    }
    default:
      return null;
  }
}
