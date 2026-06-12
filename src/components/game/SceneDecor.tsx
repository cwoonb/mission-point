import { motion } from 'framer-motion';

/** 둥둥 떠다니는 구름 장식 */
export function Clouds() {
  return (
    <>
      <motion.div
        className="absolute text-3xl opacity-90 pointer-events-none"
        style={{ left: '12%', top: '7%' }}
        animate={{ x: [0, 14, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute text-2xl opacity-80 pointer-events-none"
        style={{ left: '62%', top: '5%' }}
        animate={{ x: [0, -16, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>
      <motion.div
        className="absolute text-lg opacity-70 pointer-events-none"
        style={{ left: '82%', top: '15%' }}
        animate={{ x: [0, 10, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        ☁️
      </motion.div>
    </>
  );
}

/** 해 장식 (천천히 반짝임) */
export function SunBadge() {
  return (
    <motion.div
      className="absolute text-3xl pointer-events-none"
      style={{ left: '8%', top: '6%' }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      ☀️
    </motion.div>
  );
}

/** 화면 하단을 채우는 잔디 바닥 */
export function GrassGround({ heightPct = 58 }: { heightPct?: number }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 pointer-events-none"
      style={{
        height: `${heightPct}%`,
        backgroundImage:
          'radial-gradient(circle, rgba(255,255,255,0.15) 1.5px, transparent 1.5px), linear-gradient(180deg, #92E07C 0%, #6FBF4F 55%, #5CA940 100%)',
        backgroundSize: '16px 16px, 100% 100%',
      }}
    />
  );
}

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

/** 천장 조명 — 은은하게 빛나는 애니메이션 */
export function CeilingLamp({ x = 78, y = 6 }: { x?: number; y?: number }) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 text-2xl pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%` }}
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      💡
    </motion.div>
  );
}

const TILE_COLORS: Record<string, string> = {
  G: '#7FD45A',
  g: '#8FE06A',
  P: '#E8D2A0',
  p: '#DCC18C',
  F: '#F9A8C9',
  W: '#7FC4E8',
  T: '#5CA940',
};

/**
 * 문자 배열로 정의한 타일맵을 렌더링한다.
 * 각 문자는 TILE_COLORS의 키와 매칭되며, 알 수 없는 문자는 기본 잔디색으로 표시한다.
 */
export function TileMap({ layout, className = '' }: { layout: string[]; className?: string }) {
  const rows = layout.length;
  const cols = layout[0]?.length ?? 0;
  return (
    <div
      className={`absolute inset-0 grid pointer-events-none ${className}`}
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
    >
      {layout.flatMap((row, ry) =>
        row.split('').map((cell, cx) => (
          <div key={`${ry}-${cx}`} style={{ backgroundColor: TILE_COLORS[cell] ?? TILE_COLORS.G }} />
        ))
      )}
    </div>
  );
}
