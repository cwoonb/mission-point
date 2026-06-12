import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Store, Backpack, Palette, Star } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import PhaserVillageCanvas, { type PhaserVillageCanvasHandle } from '../components/game/phaser/PhaserVillageCanvas';
import type { VillageSceneData } from '../components/game/phaser/VillageScene';
import { houseTierFromItemId } from '../components/game/house/HouseRenderer';
import { RESIDENT_SPECIES } from '../components/game/assets/residentSpecies';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import { formatPoint } from '../utils/helpers';
import { levelThreshold } from '../utils/villageRewards';
import { consumeVillageEffects } from '../utils/villageEffects';
import { playSound } from '../utils/sound';
import type { CosmeticSlot } from '../types';

const DEFAULT_COSMETIC_COLORS: Partial<Record<CosmeticSlot, string>> = {
  TOP: '#8FD9C4',
  BOTTOM: '#5B7FDB',
  SHOES: '#4A4A4A',
};

export default function VillagePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getVillage, ensureVillage, getPlacementsByZone, getPlacement, setVillageName } = useVillageStore();
  const { getItem, getUserResidents } = useDecorationStore();
  const { getProfile, ensureProfile, cosmetics } = useCharacterStore();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const canvasRef = useRef<PhaserVillageCanvasHandle>(null);

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

  const cosmeticById = new Map(cosmetics.map((c) => [c.id, c]));
  const colorFor = (slot: CosmeticSlot): string => {
    const id = profile.equipped[slot];
    if (!id) return DEFAULT_COSMETIC_COLORS[slot] ?? '#FFFFFF';
    return cosmeticById.get(id)?.color ?? DEFAULT_COSMETIC_COLORS[slot] ?? '#FFFFFF';
  };

  const rarePlacement = placements.map((p) => getItem(p.itemId)).find((item) => item && item.rarity !== 'COMMON');

  const sceneData: VillageSceneData = {
    playerColors: {
      skin: profile.skinColor,
      hair: profile.hairColor,
      top: colorFor('TOP'),
      bottom: colorFor('BOTTOM'),
      shoes: colorFor('SHOES'),
    },
    npcs: sceneResidents.map((r) => ({
      id: r.id,
      species: RESIDENT_SPECIES[r.emoji]?.species ?? 'dog',
      name: r.name,
      dialogue: r.dialogue.length > 0 ? r.dialogue : [r.description],
    })),
    houseTier: houseTierFromItemId(houseItem?.id),
    rareItem: rarePlacement ? { emoji: rarePlacement.emoji } : undefined,
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

  const handleNavigate = (target: 'shop' | 'inventory' | 'decorate' | 'house') => {
    if (target === 'shop') navigate('/village/shop');
    else if (target === 'inventory') navigate('/village/inventory');
    else if (target === 'decorate') navigate('/village/decorate');
    else navigate('/');
  };

  const handleReady = () => {
    const diff = consumeVillageEffects(currentUser.id, currentUser.point, village.level);
    if (diff.levelUp) {
      canvasRef.current?.playLevelUpEffect();
      playSound('levelUp');
    } else if (diff.missionComplete) {
      canvasRef.current?.playMissionCompleteEffect();
      playSound('coin');
    }
    if (diff.itemPlaced) {
      canvasRef.current?.playItemPlacedEffect(0.5, 0.55);
    }
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
            <span className="glossy flex items-center gap-1 text-sm font-bold bg-white/20 rounded-full px-3 py-1">
              <Star size={13} className="fill-amber-300 text-amber-300" />
              {formatPoint(currentUser.point)}P
            </span>
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

        {/* WebGL 마을 씬 — 타일맵/카메라/캐릭터 이동/주민 NPC/파티클 */}
        <PhaserVillageCanvas
          ref={canvasRef}
          data={sceneData}
          onNavigate={handleNavigate}
          onResidentTap={() => {}}
          onReady={handleReady}
          height={460}
        />

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
