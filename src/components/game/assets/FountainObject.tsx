import { motion } from 'framer-motion';
import { palette, tint } from './palette';
import GroundShadow from './Shadow';

/** 분수 — 마을 광장의 중심 오브젝트, 돌받침 질감 + 물결 반짝임 + 물방울 애니메이션 */
export default function FountainObject({ size = 60 }: { size?: number }) {
  const stoneDark = palette.stoneDark;
  const waterLight = tint(palette.water, 0.25);
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }} xmlns="http://www.w3.org/2000/svg">
      <GroundShadow cx={50} cy={92} rx={42} ry={6} />
      {/* 외곽 돌받침 */}
      <ellipse cx="50" cy="84" rx="44" ry="12" fill={palette.stone} />
      <ellipse cx="50" cy="81" rx="44" ry="9" fill={tint(palette.stone, 0.15)} />
      {[-30, -10, 10, 30].map((dx) => (
        <ellipse key={dx} cx={50 + dx} cy="86" rx="6" ry="2" fill={stoneDark} opacity="0.3" />
      ))}
      {/* 물 웅덩이 */}
      <ellipse cx="50" cy="80" rx="36" ry="10" fill={palette.waterDeep} />
      <ellipse cx="50" cy="78" rx="36" ry="9" fill={palette.water} />
      <ellipse cx="44" cy="76" rx="14" ry="3" fill={waterLight} opacity="0.6" />
      {/* 기둥 */}
      <rect x="46" y="42" width="8" height="36" fill={palette.stone} />
      <rect x="46" y="42" width="3" height="36" fill={tint(palette.stone, 0.2)} opacity="0.7" />
      {/* 상단 그릇 */}
      <circle cx="50" cy="34" r="13" fill={palette.water} />
      <circle cx="46" cy="30" r="4" fill={waterLight} opacity="0.7" />
      <circle cx="50" cy="34" r="13" fill="none" stroke={stoneDark} strokeWidth="2" />
      {/* 튀어오르는 물방울 */}
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
