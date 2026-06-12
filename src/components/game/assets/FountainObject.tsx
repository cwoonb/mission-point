import { motion } from 'framer-motion';
import { palette } from './palette';

/** 분수 — 마을 광장의 중심 오브젝트, 물방울이 위아래로 튀어오른다 */
export default function FountainObject({ size = 60 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="84" rx="44" ry="12" fill={palette.stone} />
      <ellipse cx="50" cy="80" rx="36" ry="10" fill={palette.water} />
      <rect x="46" y="42" width="8" height="36" fill={palette.stone} />
      <circle cx="50" cy="34" r="13" fill={palette.water} />
      <circle cx="50" cy="34" r="13" fill="none" stroke={palette.stoneDark} strokeWidth="2" />
      {[36, 50, 64].map((cx, i) => (
        <motion.circle
          key={cx}
          cx={cx}
          cy={28}
          r="2.4"
          fill={palette.waterDeep}
          animate={{ cy: [28, 6, 28], opacity: [0.9, 0.15, 0.9] }}
          transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        />
      ))}
    </svg>
  );
}
