import { useCallback, useEffect, useRef, useState } from 'react';

export interface MovementBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

type Facing = 'down' | 'left' | 'right';

const KEY_DIR: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  w: [0, -1],
  s: [0, 1],
  a: [-1, 0],
  d: [1, 0],
  W: [0, -1],
  S: [0, 1],
  A: [-1, 0],
  D: [1, 0],
};

/**
 * 게임 씬 안에서 캐릭터의 위치/방향/걷기 상태를 관리하는 훅.
 * 가상 조이스틱(`move`), 키보드(WASD/방향키, 내부 처리), 탭-이동(`moveTo`)을 모두 지원한다.
 */
export function usePlayerMovement(
  initial: { x: number; y: number },
  bounds: MovementBounds,
  options?: { keyboardStep?: number; tapStep?: number }
) {
  const [pos, setPos] = useState(initial);
  const [facing, setFacing] = useState<Facing>('down');
  const [walking, setWalking] = useState(false);

  const posRef = useRef(pos);
  posRef.current = pos;
  const targetRef = useRef<{ x: number; y: number } | null>(null);
  const walkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keyboardStep = options?.keyboardStep ?? 2;
  const tapStep = options?.tapStep ?? 1.6;

  const markWalking = useCallback(() => {
    setWalking(true);
    if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
    walkTimeoutRef.current = setTimeout(() => setWalking(false), 250);
  }, []);

  /** 조이스틱/키보드용 — 즉시 이동 */
  const move = useCallback(
    (dx: number, dy: number) => {
      if (dx === 0 && dy === 0) return;
      targetRef.current = null;
      setPos((p) => ({
        x: Math.min(bounds.xMax, Math.max(bounds.xMin, p.x + dx)),
        y: Math.min(bounds.yMax, Math.max(bounds.yMin, p.y + dy)),
      }));
      if (dx < -0.05) setFacing('left');
      else if (dx > 0.05) setFacing('right');
      markWalking();
    },
    [bounds.xMax, bounds.xMin, bounds.yMax, bounds.yMin, markWalking]
  );

  /** 탭-이동용 — 목표 좌표(%) 설정, 매 프레임 한 걸음씩 다가감 */
  const moveTo = useCallback((x: number, y: number) => {
    targetRef.current = {
      x: Math.min(bounds.xMax, Math.max(bounds.xMin, x)),
      y: Math.min(bounds.yMax, Math.max(bounds.yMin, y)),
    };
  }, [bounds.xMax, bounds.xMin, bounds.yMax, bounds.yMin]);

  // 탭-이동 애니메이션 루프
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const target = targetRef.current;
      if (target) {
        const p = posRef.current;
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1) {
          targetRef.current = null;
          setWalking(false);
        } else {
          const stepLen = Math.min(dist, tapStep);
          const nx = Math.min(bounds.xMax, Math.max(bounds.xMin, p.x + (dx / dist) * stepLen));
          const ny = Math.min(bounds.yMax, Math.max(bounds.yMin, p.y + (dy / dist) * stepLen));
          setPos({ x: nx, y: ny });
          if (dx < -0.05) setFacing('left');
          else if (dx > 0.05) setFacing('right');
          setWalking(true);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [bounds.xMax, bounds.xMin, bounds.yMax, bounds.yMin, tapStep]);

  // 키보드(WASD / 방향키) 이동
  useEffect(() => {
    const pressed = new Set<string>();
    let raf: number | null = null;

    const tick = () => {
      let dx = 0;
      let dy = 0;
      pressed.forEach((key) => {
        const dir = KEY_DIR[key];
        if (dir) {
          dx += dir[0];
          dy += dir[1];
        }
      });
      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy) || 1;
        move((dx / len) * keyboardStep, (dy / len) * keyboardStep);
      }
      raf = requestAnimationFrame(tick);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!KEY_DIR[e.key]) return;
      if (!pressed.has(e.key)) pressed.add(e.key);
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressed.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [move, keyboardStep]);

  useEffect(() => () => {
    if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
  }, []);

  return { pos, facing, walking, move, moveTo };
}
