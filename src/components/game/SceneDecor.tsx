import { motion } from 'framer-motion';

/** 방 안 배경 — 벽지(위)와 나무 바닥(아래)을 그려준다 */
export function RoomBackdrop({ wallPct = 58 }: { wallPct?: number }) {
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0"
        style={{ height: `${wallPct}%`, background: 'linear-gradient(180deg, #FCEFE3 0%, #F7DEC9 100%)' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: `${100 - wallPct}%`,
          backgroundImage: 'repeating-linear-gradient(180deg, #E3B57E 0px, #E3B57E 18px, #D9A56C 18px, #D9A56C 20px)',
        }}
      />
      <div className="absolute left-0 right-0" style={{ top: `${wallPct}%`, height: 4, background: '#C99A66' }} />
    </>
  );
}

/** 천장 조명 — SVG 펜던트 램프, 은은하게 빛나는 애니메이션 */
export function CeilingLamp({ x = 78, y = 6 }: { x?: number; y?: number }) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="34" height="40" viewBox="0 0 34 40" xmlns="http://www.w3.org/2000/svg">
        <line x1="17" y1="0" x2="17" y2="10" stroke="#C99A66" strokeWidth="2" />
        <path d="M4 10 H30 L26 26 H8 Z" fill="#FFE69A" />
        <ellipse cx="17" cy="30" rx="13" ry="6" fill="#FFF6D6" opacity="0.7" />
      </svg>
    </motion.div>
  );
}
