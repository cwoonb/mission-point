import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Store, Backpack, Palette } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import GameScene from '../components/game/GameScene';
import GameObject from '../components/game/GameObject';
import MovementControls from '../components/game/MovementControls';
import PlayerCharacter from '../components/game/PlayerCharacter';
import ResidentNPC from '../components/game/ResidentNPC';
import HouseBuilding, { houseTierFromItemId } from '../components/game/HouseBuilding';
import { Clouds, TileMap } from '../components/game/SceneDecor';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import { formatPoint } from '../utils/helpers';
import { levelThreshold } from '../utils/villageRewards';
import type { VillageSlotType } from '../types';

const VILLAGE_LAYOUT = [
  'TGGGGGGGGT',
  'GgGFGGFgGg',
  'GGGGPPGGGG',
  'GGGGPPGGGG',
  'PPPPPPPPPP',
  'GGGGPPGGGG',
  'GgGFGGFgGg',
  'TGGGGGGGGT',
];

const VILLAGE_SLOT_POSITIONS: Partial<Record<VillageSlotType, { x: number; y: number }>> = {
  SCHOOL: { x: 22, y: 32 },
  GARDEN: { x: 14, y: 68 },
  YARD: { x: 86, y: 68 },
  PATH: { x: 50, y: 58 },
};

const SLOT_FALLBACK_EMOJI: Partial<Record<VillageSlotType, string>> = {
  GARDEN: '🌳',
  YARD: '🌻',
  PATH: '⛲',
  SCHOOL: '🏫',
};

export default function VillagePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getVillage, ensureVillage, getPlacementsByZone, getPlacement, setVillageName } = useVillageStore();
  const { getItem, getUserResidents } = useDecorationStore();
  const { getProfile, ensureProfile, cosmetics } = useCharacterStore();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [charPos, setCharPos] = useState({ x: 50, y: 76 });
  const [facing, setFacing] = useState<'down' | 'left' | 'right'>('down');
  const [walking, setWalking] = useState(false);
  const walkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentUser) return null;

  const village = getVillage(currentUser.id) ?? ensureVillage(currentUser.id, currentUser.name);
  const profile = getProfile(currentUser.id) ?? ensureProfile(currentUser.id, currentUser.name);
  const placements = getPlacementsByZone(currentUser.id, 'VILLAGE');
  const housePlacement = getPlacement(currentUser.id, 'HOUSE');
  const houseItem = housePlacement ? getItem(housePlacement.itemId) : undefined;
  const residents = getUserResidents(currentUser.id);
  const sceneResidents = residents.slice(0, 5);

  const expNeeded = levelThreshold(village.level);
  const expProgress = Math.min(100, Math.round((village.exp / expNeeded) * 100));

  const handleMove = (dx: number, dy: number) => {
    setCharPos((p) => ({
      x: Math.min(94, Math.max(6, p.x + dx)),
      y: Math.min(94, Math.max(28, p.y + dy)),
    }));
    if (dx < 0) setFacing('left');
    else if (dx > 0) setFacing('right');
    setWalking(true);
    if (walkTimeoutRef.current) clearTimeout(walkTimeoutRef.current);
    walkTimeoutRef.current = setTimeout(() => setWalking(false), 300);
  };

  const openEditName = () => {
    setNameInput(village.name);
    setEditNameOpen(true);
  };

  const saveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) setVillageName(currentUser.id, trimmed);
    setEditNameOpen(false);
  };

  return (
    <div className="page-container">
      <Header title="🏘️ 우리 마을" showBack />

      <div className="content-area px-4 py-4 space-y-4">
        {/* 마을 정보 카드 */}
        <div className="bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-400 rounded-3xl p-4 text-white shadow-md">
          <div className="flex items-center justify-between">
            <button onClick={openEditName} className="flex items-center gap-1.5">
              <span className="font-black text-lg">{village.name}</span>
              <Pencil size={13} className="text-white/70" />
            </button>
            <span className="text-sm font-bold bg-white/20 rounded-full px-3 py-1">⭐ {formatPoint(currentUser.point)}P</span>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80 mb-1">
              <span>Lv.{village.level}</span>
              <span>{village.exp} / {expNeeded} EXP</span>
            </div>
            <div className="h-2.5 bg-white/25 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${expProgress}%` }}
                transition={{ duration: 0.6 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </div>

        {/* 타일맵 마을 풍경 */}
        <GameScene height={440}>
          <Clouds />
          <TileMap layout={VILLAGE_LAYOUT} />

          {/* 우리 집 (앞마당으로 이동) */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '2%' }}>
            <HouseBuilding
              tier={houseTierFromItemId(houseItem?.id)}
              size={100}
              onClick={() => navigate('/')}
              label="우리 집"
            />
          </div>

          {/* 놀이터 */}
          <GameObject x={78} y={30} emoji="🛝" size={34} bob label="놀이터" />

          {/* 꾸미기 슬롯 시설 */}
          {Object.entries(VILLAGE_SLOT_POSITIONS).map(([slot, pos]) => {
            const placement = placements.find((p) => p.slot === (slot as VillageSlotType));
            const item = placement ? getItem(placement.itemId) : undefined;
            const fallback = SLOT_FALLBACK_EMOJI[slot as VillageSlotType];
            if (!item && !fallback) return null;
            return (
              <GameObject key={slot} x={pos.x} y={pos.y} emoji={item?.emoji ?? fallback} size={34} bob label={item?.name} />
            );
          })}

          {/* 마을 주민 */}
          {sceneResidents.map((r, i) => (
            <ResidentNPC key={r.id} x={14 + i * 18} y={88} resident={r} size={32} />
          ))}

          {/* 플레이어 캐릭터 */}
          <GameObject x={charPos.x} y={charPos.y}>
            <PlayerCharacter profile={profile} cosmetics={cosmetics} size={64} facing={facing} walking={walking} />
          </GameObject>

          <MovementControls onMove={handleMove} />
        </GameScene>

        {/* 동물 주민 도감 */}
        {residents.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">🐾 우리 마을 주민 ({residents.length})</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {residents.map((r) => (
                <div key={r.id} className="flex-shrink-0 bg-white rounded-2xl shadow-sm px-3 py-2 text-center min-w-[72px]">
                  <div className="text-2xl">{r.emoji}</div>
                  <p className="text-xs font-bold text-gray-700 mt-1">{r.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="space-y-2.5 pb-4">
          <Button fullWidth size="lg" variant="amber" onClick={() => navigate('/village/shop')} className="rounded-2xl">
            <Store size={18} className="mr-1.5" /> 상점으로 가기
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/village/inventory')} className="rounded-2xl">
            <Backpack size={18} className="mr-1.5" /> 보유함으로 가기
          </Button>
          <Button fullWidth size="lg" variant="success" onClick={() => navigate('/village/decorate')} className="rounded-2xl">
            <Palette size={18} className="mr-1.5" /> 꾸미기 모드로 가기
          </Button>
        </div>
      </div>

      <Modal isOpen={editNameOpen} onClose={() => setEditNameOpen(false)} title="✏️ 마을 이름 바꾸기">
        <div className="space-y-4">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={20}
            className="w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <Button fullWidth variant="success" onClick={saveName}>저장하기</Button>
        </div>
      </Modal>
    </div>
  );
}
