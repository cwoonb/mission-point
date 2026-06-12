import { motion } from 'framer-motion';
import { palette } from './palette';

/** 둥근 뭉치구름 SVG */
export function CloudObject({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="28" cy="40" rx="22" ry="16" fill="#FFFFFF" />
      <ellipse cx="54" cy="30" rx="28" ry="22" fill="#FFFFFF" />
      <ellipse cx="78" cy="40" rx="18" ry="14" fill="#FFFFFF" />
      <rect x="14" y="38" width="74" height="18" rx="9" fill="#FFFFFF" />
    </svg>
  );
}

/** 둥둥 떠다니는 구름 장식들 */
export function Clouds() {
  return (
    <>
      <motion.div
        className="absolute opacity-90 pointer-events-none"
        style={{ left: '10%', top: '6%' }}
        animate={{ x: [0, 14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CloudObject size={52} />
      </motion.div>
      <motion.div
        className="absolute opacity-80 pointer-events-none"
        style={{ left: '58%', top: '4%' }}
        animate={{ x: [0, -16, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CloudObject size={40} />
      </motion.div>
      <motion.div
        className="absolute opacity-70 pointer-events-none"
        style={{ left: '80%', top: '13%' }}
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <CloudObject size={28} />
      </motion.div>
    </>
  );
}

/** 반짝이는 햇살 SVG */
export function SunObject({ size = 44 }: { size?: number }) {
  const rays = Array.from({ length: 8 }).map((_, i) => {
    const angle = (Math.PI / 4) * i;
    const x1 = 50 + Math.cos(angle) * 33;
    const y1 = 50 + Math.sin(angle) * 33;
    const x2 = 50 + Math.cos(angle) * 45;
    const y2 = 50 + Math.sin(angle) * 45;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.flowerYellow} strokeWidth="5" strokeLinecap="round" />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {rays}
      <circle cx="50" cy="50" r="26" fill={palette.flowerYellow} />
      <circle cx="42" cy="42" r="9" fill={palette.flowerCenter} opacity="0.6" />
    </svg>
  );
}

/** 천천히 반짝이는 해 장식 */
export function SunBadge() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: '6%', top: '5%' }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <SunObject size={44} />
    </motion.div>
  );
}
