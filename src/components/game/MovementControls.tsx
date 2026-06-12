import { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface MovementControlsProps {
  onMove: (dx: number, dy: number) => void;
  step?: number;
}

const DIRS: Record<string, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

const KEY_DIR: Record<string, keyof typeof DIRS> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export default function MovementControls({ onMove, step = 3 }: MovementControlsProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = (dir: keyof typeof DIRS) => {
    const [dx, dy] = DIRS[dir];
    stop();
    onMoveRef.current(dx * step, dy * step);
    intervalRef.current = setInterval(() => onMoveRef.current(dx * step, dy * step), 120);
  };

  useEffect(() => {
    const pressed = new Set<string>();
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key];
      if (!dir || pressed.has(e.key)) return;
      pressed.add(e.key);
      const [dx, dy] = DIRS[dir];
      onMoveRef.current(dx * step, dy * step);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      pressed.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [step]);

  useEffect(() => () => stop(), []);

  const btnClass = 'w-9 h-9 bg-white/80 backdrop-blur rounded-xl shadow-md flex items-center justify-center active:scale-90 active:bg-white transition-transform text-gray-600';

  return (
    <div className="absolute bottom-3 right-3 grid grid-cols-3 grid-rows-3 gap-1 w-32 h-32 z-10">
      <button
        className={`${btnClass} col-start-2 row-start-1`}
        onMouseDown={() => start('up')} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={(e) => { e.preventDefault(); start('up'); }} onTouchEnd={stop}
      >
        <ChevronUp size={18} />
      </button>
      <button
        className={`${btnClass} col-start-1 row-start-2`}
        onMouseDown={() => start('left')} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={(e) => { e.preventDefault(); start('left'); }} onTouchEnd={stop}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        className={`${btnClass} col-start-3 row-start-2`}
        onMouseDown={() => start('right')} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={(e) => { e.preventDefault(); start('right'); }} onTouchEnd={stop}
      >
        <ChevronRight size={18} />
      </button>
      <button
        className={`${btnClass} col-start-2 row-start-3`}
        onMouseDown={() => start('down')} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={(e) => { e.preventDefault(); start('down'); }} onTouchEnd={stop}
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );
}
