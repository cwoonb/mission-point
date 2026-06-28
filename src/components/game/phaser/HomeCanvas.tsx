import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import HomeScene, { MAP_W, MAP_H, type HomeSceneData, type PlacementView, type EmoteType, type PoseType, type TimeOfDay, type Weather } from './HomeScene';
import VirtualJoystick from '../VirtualJoystick';

/** 낮/저녁/밤 화면 틴트 (CSS 오버레이 — Phaser 전체화면 Shape보다 안정적) */
const TINT: Record<TimeOfDay, string> = {
  day: 'transparent',
  evening: 'rgba(255, 138, 76, 0.26)',
  night: 'rgba(16, 24, 60, 0.50)',
};

export interface HomeCanvasHandle {
  setPlacements: (list: PlacementView[]) => void;
  setEditMode: (on: boolean) => void;
  startPlacing: (itemId: string) => void;
  cancelPlacing: () => void;
  clearSelection: () => void;
  setPose: (pose: PoseType) => void;
  playEmote: (type: EmoteType) => void;
  applyTimeOfDay: (t: TimeOfDay) => void;
  setWeather: (w: Weather) => void;
}

interface Props {
  data: HomeSceneData;
  editMode: boolean;
  onReady?: () => void;
  onPlace?: (itemId: string, x: number, y: number) => void;
  onMove?: (id: string, x: number, y: number) => void;
  onSelect?: (id: string | null) => void;
  onPetTap?: () => void;
  onHouseTap?: () => void;
  height?: number;
}

const HomeCanvas = forwardRef<HomeCanvasHandle, Props>(function HomeCanvas(
  { data, editMode, onReady, onPlace, onMove, onSelect, onPetTap, onHouseTap, height = 480 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HomeScene | null>(null);
  const cbs = useRef({ onReady, onPlace, onMove, onSelect, onPetTap, onHouseTap });
  cbs.current = { onReady, onPlace, onMove, onSelect, onPetTap, onHouseTap };
  const dataRef = useRef(data);
  dataRef.current = data;
  const [tod, setTod] = useState<TimeOfDay>(data.timeOfDay);
  const [freeLook, setFreeLook] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const bridge = new Phaser.Events.EventEmitter();
    const scene = new HomeScene();
    scene.configure(dataRef.current, bridge);
    sceneRef.current = scene;

    bridge.on('ready', () => cbs.current.onReady?.());
    bridge.on('place', (p: { itemId: string; x: number; y: number }) => cbs.current.onPlace?.(p.itemId, p.x, p.y));
    bridge.on('move', (p: { id: string; x: number; y: number }) => cbs.current.onMove?.(p.id, p.x, p.y));
    bridge.on('select', (id: string | null) => cbs.current.onSelect?.(id));
    bridge.on('pet-tap', () => cbs.current.onPetTap?.());
    bridge.on('house-tap', () => cbs.current.onHouseTap?.());
    bridge.on('freelook', (on: boolean) => setFreeLook(on));

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: MAP_W,
      height: MAP_H,
      parent: containerRef.current,
      backgroundColor: '#7DBE5A',
      render: { pixelArt: true, roundPixels: true },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      // 내부 해상도를 맵 크기로 → 기본 줌(전체 맞춤)에서 마당 전체가 보임. FIT으로 컨테이너에 반응형 스케일
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene,
    });

    return () => { game.destroy(true); sceneRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { sceneRef.current?.setEditMode(editMode); }, [editMode]);

  useImperativeHandle(ref, () => ({
    setPlacements: (list) => sceneRef.current?.setPlacements(list),
    setEditMode: (on) => sceneRef.current?.setEditMode(on),
    startPlacing: (itemId) => sceneRef.current?.startPlacing(itemId),
    cancelPlacing: () => sceneRef.current?.cancelPlacing(),
    clearSelection: () => sceneRef.current?.clearSelection(),
    setPose: (pose) => sceneRef.current?.setPose(pose),
    playEmote: (type) => sceneRef.current?.playEmote(type),
    applyTimeOfDay: (t) => { setTod(t); sceneRef.current?.applyTimeOfDay(t); },
    setWeather: (w) => sceneRef.current?.setWeather(w),
  }), []);

  const handleJoystick = (dx: number, dy: number) => sceneRef.current?.setJoystick(dx / 2.2, dy / 2.2);
  const zoomIn = () => sceneRef.current?.zoomBy(1.2);
  const zoomOut = () => sceneRef.current?.zoomBy(1 / 1.2);
  const recenter = () => sceneRef.current?.recenter();

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-inner bg-emerald-100 w-full" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
      <div ref={containerRef} className="absolute inset-0 [&>canvas]:![image-rendering:pixelated]" />
      <div
        className="absolute inset-0 pointer-events-none transition-colors duration-700"
        style={{ background: TINT[tod], mixBlendMode: 'multiply' }}
      />

      {/* 카메라 줌 컨트롤 */}
      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
        <button onClick={zoomIn} aria-label="확대" className="w-9 h-9 rounded-xl bg-white/85 backdrop-blur shadow-md flex items-center justify-center text-gray-700 active:scale-90 transition-transform">
          <Plus size={18} />
        </button>
        <button onClick={zoomOut} aria-label="축소" className="w-9 h-9 rounded-xl bg-white/85 backdrop-blur shadow-md flex items-center justify-center text-gray-700 active:scale-90 transition-transform">
          <Minus size={18} />
        </button>
      </div>

      {/* 확대/팬 중일 때 전체 보기로 복귀 */}
      {freeLook && (
        <button onClick={recenter} className="absolute bottom-3 right-3 px-3 h-9 rounded-xl bg-emerald-500/90 backdrop-blur shadow-md flex items-center gap-1.5 text-white text-xs font-bold active:scale-90 transition-transform">
          <Maximize2 size={15} /> 전체 보기
        </button>
      )}

      {!editMode && <VirtualJoystick onMove={handleJoystick} />}
    </div>
  );
});

export default HomeCanvas;
