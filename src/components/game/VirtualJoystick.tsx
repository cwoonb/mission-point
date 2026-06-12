import { useEffect, useRef, useState } from 'react';

interface VirtualJoystickProps {
  /** 매 프레임 호출되는 이동 콜백 (퍼센트 단위 dx, dy) */
  onMove: (dx: number, dy: number) => void;
  size?: number;
  /** 1프레임당 이동 속도 (% 단위) */
  speed?: number;
}

/** 화면 좌하단에 떠 있는 반투명 가상 조이스틱. 누른 동안 방향으로 캐릭터를 이동시킨다. */
export default function VirtualJoystick({ onMove, size = 84, speed = 2.2 }: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const dirRef = useRef({ x: 0, y: 0 });
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const pointerIdRef = useRef<number | null>(null);
  const radius = size / 2;

  const updateFromPoint = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    setStick({ x: dx, y: dy });
    dirRef.current = dist < 4 ? { x: 0, y: 0 } : { x: dx / radius, y: dy / radius };
  };

  const stop = () => {
    setActive(false);
    setStick({ x: 0, y: 0 });
    dirRef.current = { x: 0, y: 0 };
    pointerIdRef.current = null;
  };

  useEffect(() => {
    if (!active) return;
    let raf: number;
    const tick = () => {
      const { x, y } = dirRef.current;
      if (x !== 0 || y !== 0) onMoveRef.current(x * speed, y * speed);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, speed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    setActive(true);
    updateFromPoint(e.clientX, e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    updateFromPoint(e.clientX, e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    stop();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(e) => { if (pointerIdRef.current === e.pointerId) stop(); }}
      className="absolute bottom-3 left-3 z-10 rounded-full bg-white/25 border-2 border-white/50 touch-none select-none"
      style={{ width: size, height: size }}
    >
      <div
        className={`absolute rounded-full bg-white shadow-md ${active ? 'opacity-90' : 'opacity-50'}`}
        style={{
          width: size * 0.46,
          height: size * 0.46,
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) translate(${stick.x}px, ${stick.y}px)`,
        }}
      />
    </div>
  );
}
