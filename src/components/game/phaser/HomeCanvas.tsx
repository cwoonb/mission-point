import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import HomeScene, { type HomeSceneData, type PlacementView, type EmoteType, type PoseType, type TimeOfDay, type Weather } from './HomeScene';
import VirtualJoystick from '../VirtualJoystick';

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

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: 360,
      height,
      parent: containerRef.current,
      backgroundColor: '#7DBE5A',
      render: { pixelArt: true, roundPixels: true },
      physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
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
    applyTimeOfDay: (t) => sceneRef.current?.applyTimeOfDay(t),
    setWeather: (w) => sceneRef.current?.setWeather(w),
  }), []);

  const handleJoystick = (dx: number, dy: number) => sceneRef.current?.setJoystick(dx / 2.2, dy / 2.2);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-inner bg-emerald-100" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 [&>canvas]:![image-rendering:pixelated]" />
      {!editMode && <VirtualJoystick onMove={handleJoystick} />}
    </div>
  );
});

export default HomeCanvas;
