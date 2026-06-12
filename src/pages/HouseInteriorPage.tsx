import { useNavigate } from 'react-router-dom';
import { DoorOpen, Palette } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import GameScene from '../components/game/GameScene';
import GameObject from '../components/game/GameObject';
import VirtualJoystick from '../components/game/VirtualJoystick';
import PlayerCharacter from '../components/game/PlayerCharacter';
import { RoomBackdrop, CeilingLamp } from '../components/game/SceneDecor';
import { BedObject, DeskObject, BookshelfObject, PlantObject, RugObject, WindowObject, ChairObject } from '../components/game/assets/InteriorObjects';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import type { VillageSlotType } from '../types';

const INTERIOR_SLOT_POSITIONS: Partial<Record<VillageSlotType, { x: number; y: number; size: number }>> = {
  WINDOW: { x: 50, y: 14, size: 52 },
  RUG: { x: 50, y: 88, size: 64 },
  BED: { x: 20, y: 64, size: 50 },
  BOOKSHELF: { x: 84, y: 40, size: 40 },
  DESK: { x: 80, y: 66, size: 42 },
  PLANT: { x: 10, y: 80, size: 30 },
  INTERIOR: { x: 50, y: 66, size: 36 },
};

/** 꾸미기 아이템이 배치되지 않은 슬롯에 표시할 기본 SVG 가구 */
const SLOT_FALLBACK_RENDER: Partial<Record<VillageSlotType, (size: number) => JSX.Element>> = {
  WINDOW: (size) => <WindowObject size={size} />,
  RUG: (size) => <RugObject size={size} />,
  BED: (size) => <BedObject size={size} />,
  BOOKSHELF: (size) => <BookshelfObject size={size} />,
  DESK: (size) => <DeskObject size={size} />,
  PLANT: (size) => <PlantObject size={size} />,
  INTERIOR: (size) => <ChairObject size={size} />,
};

export default function HouseInteriorPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getPlacementsByZone } = useVillageStore();
  const { getItem } = useDecorationStore();
  const { getProfile, ensureProfile, cosmetics } = useCharacterStore();

  const { pos: charPos, facing, walking, move, moveTo } = usePlayerMovement(
    { x: 50, y: 76 },
    { xMin: 10, xMax: 90, yMin: 60, yMax: 94 }
  );

  if (!currentUser) return null;

  const profile = getProfile(currentUser.id) ?? ensureProfile(currentUser.id, currentUser.name);
  const placements = getPlacementsByZone(currentUser.id, 'HOUSE_INTERIOR');

  return (
    <div className="page-container">
      <Header title="🏠 우리 집" showBack />

      <div className="content-area px-4 py-4 space-y-4">
        <GameScene height={440} onBackgroundTap={moveTo}>
          <RoomBackdrop wallPct={58} />
          <CeilingLamp />

          {(['RUG', 'WINDOW', 'BED', 'BOOKSHELF', 'DESK', 'PLANT', 'INTERIOR'] as VillageSlotType[]).map((slot) => {
            const pos = INTERIOR_SLOT_POSITIONS[slot];
            if (!pos) return null;
            const placement = placements.find((p) => p.slot === slot);
            const item = placement ? getItem(placement.itemId) : undefined;
            const fallback = SLOT_FALLBACK_RENDER[slot];
            if (!item && !fallback) return null;
            return (
              <GameObject key={slot} x={pos.x} y={pos.y} bob={!!item} label={item?.name}>
                {item ? <span style={{ fontSize: pos.size }}>{item.emoji}</span> : fallback?.(pos.size)}
              </GameObject>
            );
          })}

          <GameObject x={charPos.x} y={charPos.y}>
            <PlayerCharacter profile={profile} cosmetics={cosmetics} size={64} facing={facing} walking={walking} />
          </GameObject>

          <VirtualJoystick onMove={move} />
        </GameScene>

        <div className="grid grid-cols-2 gap-2.5 pb-4">
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/')} className="rounded-2xl">
            <DoorOpen size={18} className="mr-1.5" /> 집 밖으로 나가기
          </Button>
          <Button fullWidth size="lg" variant="success" onClick={() => navigate('/village/decorate?zone=HOUSE_INTERIOR')} className="rounded-2xl">
            <Palette size={18} className="mr-1.5" /> 꾸미기
          </Button>
        </div>
      </div>
    </div>
  );
}
