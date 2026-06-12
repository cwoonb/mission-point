import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DoorOpen, Palette } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import GameScene from '../components/game/GameScene';
import GameObject from '../components/game/GameObject';
import MovementControls from '../components/game/MovementControls';
import PlayerCharacter from '../components/game/PlayerCharacter';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import type { VillageSlotType } from '../types';

const INTERIOR_SLOT_POSITIONS: Partial<Record<VillageSlotType, { x: number; y: number }>> = {
  WINDOW: { x: 50, y: 14 },
  BED: { x: 22, y: 35 },
  DESK: { x: 78, y: 38 },
  BOOKSHELF: { x: 82, y: 68 },
  RUG: { x: 40, y: 75 },
  INTERIOR: { x: 18, y: 68 },
};

const SLOT_FALLBACK_EMOJI: Partial<Record<VillageSlotType, string>> = {
  WINDOW: '🪟',
  BED: '🛏️',
  DESK: '🪑',
  BOOKSHELF: '📚',
  RUG: '🟫',
  INTERIOR: '🪑',
};

export default function HouseInteriorPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getPlacementsByZone } = useVillageStore();
  const { getItem } = useDecorationStore();
  const { getProfile, ensureProfile, cosmetics } = useCharacterStore();

  const [charPos, setCharPos] = useState({ x: 50, y: 60 });
  const [facing, setFacing] = useState<'down' | 'left' | 'right'>('down');
  const [walking, setWalking] = useState(false);
  const walkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentUser) return null;

  const profile = getProfile(currentUser.id) ?? ensureProfile(currentUser.id, currentUser.name);
  const placements = getPlacementsByZone(currentUser.id, 'HOUSE_INTERIOR');

  const handleMove = (dx: number, dy: number) => {
    setCharPos((p) => ({
      x: Math.min(90, Math.max(10, p.x + dx)),
      y: Math.min(90, Math.max(25, p.y + dy)),
    }));
    if (dx < 0) setFacing('left');
    else if (dx > 0) setFacing('right');
    setWalking(true);
    if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
    walkTimeoutRef.current = setTimeout(() => setWalking(false), 300);
  };

  return (
    <div className="page-container">
      <Header title="🏠 우리 집" showBack />

      <div className="content-area px-4 py-4 space-y-4">
        <GameScene background="bg-gradient-to-b from-amber-100 via-orange-50 to-amber-200" height={420}>
          {/* 바닥 */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-amber-300/40" />

          {Object.entries(INTERIOR_SLOT_POSITIONS).map(([slot, pos]) => {
            const placement = placements.find((p) => p.slot === (slot as VillageSlotType));
            const item = placement ? getItem(placement.itemId) : undefined;
            const fallback = SLOT_FALLBACK_EMOJI[slot as VillageSlotType];
            if (!item && !fallback) return null;
            return (
              <GameObject key={slot} x={pos.x} y={pos.y} emoji={item?.emoji ?? fallback} size={42} bob={!!item} />
            );
          })}

          <GameObject x={charPos.x} y={charPos.y}>
            <PlayerCharacter profile={profile} cosmetics={cosmetics} size={64} facing={facing} walking={walking} />
          </GameObject>

          <MovementControls onMove={handleMove} />
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
