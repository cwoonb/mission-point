import { motion } from 'framer-motion';

/** 방 안 배경 — 벽지 패턴(위)과 나무 바닥 결(아래)을 그려준다 */
export function RoomBackdrop({ wallPct = 58 }: { wallPct?: number }) {
  return (
    <>
      <div
        className="absolute top-0 left-0 right-0"
        style={{
          height: `${wallPct}%`,
          backgroundImage:
            'linear-gradient(180deg, #FCEFE3 0%, #F7DEC9 100%), repeating-linear-gradient(180deg, rgba(217,165,108,0.07) 0px, rgba(217,165,108,0.07) 2px, transparent 2px, transparent 30px), repeating-linear-gradient(90deg, rgba(217,165,108,0.06) 0px, rgba(217,165,108,0.06) 2px, transparent 2px, transparent 42px)',
        }}
      />
      {/* 벽 하단 몰딩(걸레받이 위 띠) */}
      <div className="absolute left-0 right-0" style={{ top: `${wallPct * 0.8}%`, height: 3, background: '#E3C9A5', opacity: 0.65 }} />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: `${100 - wallPct}%`,
          backgroundImage:
            'repeating-linear-gradient(180deg, #E3B57E 0px, #E3B57E 18px, #D9A56C 18px, #D9A56C 20px), repeating-linear-gradient(90deg, rgba(184,133,78,0.2) 0px, rgba(184,133,78,0.2) 1.5px, transparent 1.5px, transparent 46px)',
        }}
      />
      <div className="absolute left-0 right-0" style={{ top: `${wallPct}%`, height: 4, background: '#C99A66' }} />
    </>
  );
}

/** 천장 조명 — SVG 펜던트 램프, 은은한 빛 번짐 + 깜빡이는 애니메이션 */
export function CeilingLamp({ x = 78, y = 6 }: { x?: number; y?: number }) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full"
        style={{ width: 100, height: 100, background: 'radial-gradient(circle, rgba(255,230,154,0.4) 0%, rgba(255,230,154,0) 70%)' }}
      />
      <svg width="34" height="40" viewBox="0 0 34 40" style={{ position: 'relative' }} xmlns="http://www.w3.org/2000/svg">
        <line x1="17" y1="0" x2="17" y2="10" stroke="#C99A66" strokeWidth="2" />
        <path d="M4 10 H30 L26 26 H8 Z" fill="#FFE69A" />
        <path d="M4 10 H30 L28 15 H6 Z" fill="#FFF6D6" opacity="0.7" />
        <ellipse cx="17" cy="30" rx="13" ry="6" fill="#FFF6D6" opacity="0.7" />
      </svg>
    </motion.div>
  );
}
