import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import Phaser from 'phaser';
import VillageScene, { type VillageSceneData } from './VillageScene';
import { createVillageBridge } from './events';
import VirtualJoystick from '../VirtualJoystick';

export interface PhaserVillageCanvasHandle {
  playMissionCompleteEffect: () => void;
  playLevelUpEffect: () => void;
  playItemPlacedEffect: (xPct: number, yPct: number) => void;
}

interface PhaserVillageCanvasProps {
  data: VillageSceneData;
  onNavigate: (target: 'shop' | 'inventory' | 'decorate' | 'house') => void;
  onResidentTap: (residentId: string) => void;
  onReady?: () => void;
  height?: number;
}

/** Phaser 3 WebGL 마을 씬을 마운트하는 React 래퍼. 조이스틱 입력을 씬으로 전달하고
 * 이펙트 트리거(미션완료/레벨업/아이템배치)를 ref로 노출한다. */
const PhaserVillageCanvas = forwardRef<PhaserVillageCanvasHandle, PhaserVillageCanvasProps>(function PhaserVillageCanvas(
  { data, onNavigate, onResidentTap, onReady, height = 460 },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<VillageScene | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
  const onResidentTapRef = useRef(onResidentTap);
  onResidentTapRef.current = onResidentTap;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!containerRef.current) return;

    const bridge = createVillageBridge();
    const scene = new VillageScene();
    scene.configure(dataRef.current, bridge);
    sceneRef.current = scene;

    bridge.on('navigate', (target: 'shop' | 'inventory' | 'decorate' | 'house') => onNavigateRef.current(target));
    bridge.on('resident-tap', (id: string) => onResidentTapRef.current(id));
    bridge.on('ready', () => onReadyRef.current?.());

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

    return () => {
      game.destroy(true);
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      playMissionCompleteEffect: () => sceneRef.current?.playMissionCompleteEffect(),
      playLevelUpEffect: () => sceneRef.current?.playLevelUpEffect(),
      playItemPlacedEffect: (xPct: number, yPct: number) => sceneRef.current?.playItemPlacedEffect(xPct, yPct),
    }),
    []
  );

  const handleJoystick = (dx: number, dy: number) => {
    sceneRef.current?.setJoystick(dx / 2.2, dy / 2.2);
  };

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-inner bg-emerald-100" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0 [&>canvas]:![image-rendering:pixelated]" />
      <VirtualJoystick onMove={handleJoystick} />
    </div>
  );
});

export default PhaserVillageCanvas;
