import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, Store, Backpack, Palette } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import GameScene from '../components/game/GameScene';
import GameObject from '../components/game/GameObject';
import VirtualJoystick from '../components/game/VirtualJoystick';
import PlayerCharacter from '../components/game/PlayerCharacter';
import ResidentNPC from '../components/game/ResidentNPC';
import HouseRenderer, { houseTierFromItemId } from '../components/game/house/HouseRenderer';
import { Clouds } from '../components/game/assets/SkyDecor';
import GroundField from '../components/game/assets/GroundField';
import PathRibbon from '../components/game/assets/PathRibbon';
import TreeObject from '../components/game/assets/TreeObject';
import FlowerObject from '../components/game/assets/FlowerObject';
import FenceObject from '../components/game/assets/FenceObject';
import BenchObject from '../components/game/assets/BenchObject';
import FountainObject from '../components/game/assets/FountainObject';
import MailboxObject from '../components/game/assets/MailboxObject';
import SchoolObject from '../components/game/assets/SchoolObject';
import LibraryObject from '../components/game/assets/LibraryObject';
import ShopObject from '../components/game/assets/ShopObject';
import StorageChestObject from '../components/game/assets/StorageChestObject';
import { usePlayerMovement } from '../hooks/usePlayerMovement';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import { formatPoint } from '../utils/helpers';
import { levelThreshold } from '../utils/villageRewards';
import type { VillageSlotType } from '../types';

const VILLAGE_SLOT_POSITIONS: Partial<Record<VillageSlotType, { x: number; y: number }>> = {
  SCHOOL: { x: 18, y: 38 },
  GARDEN: { x: 14, y: 58 },
  YARD: { x: 86, y: 58 },
  PATH: { x: 50, y: 58 },
};

/** 꾸미기 아이템이 배치되지 않은 슬롯에 표시할 기본 SVG 오브젝트 */
function renderSlotFallback(slot: VillageSlotType, size: number) {
  switch (slot) {
    case 'GARDEN':
      return <TreeObject variant="round" size={size} />;
    case 'YARD':
      return <FlowerObject color="purple" size={size * 0.6} />;
    case 'PATH':
      return <FountainObject size={size} />;
    case 'SCHOOL':
      return <SchoolObject size={size} />;
    default:
      return null;
  }
}

export default function VillagePage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { getVillage, ensureVillage, getPlacementsByZone, getPlacement, setVillageName } = useVillageStore();
  const { getItem, getUserResidents } = useDecorationStore();
  const { getProfile, ensureProfile, cosmetics } = useCharacterStore();

  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const { pos: charPos, facing, walking, move, moveTo } = usePlayerMovement(
    { x: 50, y: 70 },
    { xMin: 6, xMax: 94, yMin: 28, yMax: 94 }
  );

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

        {/* 작은 게임 맵처럼 구현된 마을 풍경 */}
        <GameScene height={460} onBackgroundTap={moveTo}>
          <GroundField />
          <PathRibbon
            d="M50 18 C28 20 16 38 16 56 C16 78 32 94 50 94 C68 94 84 78 84 56 C84 38 72 20 50 18 Z M50 18 L50 2"
            width={11}
          />
          <Clouds />

          {/* 울타리 — 마을 외곽 */}
          <GameObject x={4} y={10}><FenceObject size={36} /></GameObject>
          <GameObject x={96} y={10}><FenceObject size={36} /></GameObject>
          <GameObject x={4} y={96}><FenceObject size={36} /></GameObject>
          <GameObject x={96} y={96}><FenceObject size={36} /></GameObject>

          {/* 나무 & 꽃밭 */}
          <GameObject x={8} y={28} bob><TreeObject variant="pine" size={46} /></GameObject>
          <GameObject x={92} y={28} bob><TreeObject variant="round" size={50} /></GameObject>
          <GameObject x={10} y={84} bob><TreeObject variant="round" size={44} /></GameObject>
          <GameObject x={90} y={84} bob><TreeObject variant="pine" size={42} /></GameObject>
          <GameObject x={36} y={97}><FlowerObject color="pink" size={24} /></GameObject>
          <GameObject x={64} y={97}><FlowerObject color="white" size={24} /></GameObject>

          {/* 도서관 (고정 시설) */}
          <GameObject x={82} y={42} bob label="도서관" onClick={() => navigate('/village/decorate')}>
            <LibraryObject size={64} />
          </GameObject>

          {/* 상점 & 보유함 (고정 시설) */}
          <GameObject x={32} y={46} bob label="상점" onClick={() => navigate('/village/shop')}>
            <ShopObject size={62} />
          </GameObject>
          <GameObject x={68} y={32} bob label="보유함" onClick={() => navigate('/village/inventory')}>
            <StorageChestObject size={48} />
          </GameObject>

          {/* 벤치 & 우체통 */}
          <GameObject x={30} y={78}><BenchObject size={40} /></GameObject>
          <GameObject x={70} y={78}><BenchObject size={40} /></GameObject>
          <GameObject x={50} y={88}><MailboxObject size={28} /></GameObject>

          {/* 우리 집 (앞마당으로 이동) */}
          <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '0%' }}>
            <HouseRenderer
              tier={houseTierFromItemId(houseItem?.id)}
              size={92}
              onClick={() => navigate('/')}
              label="우리 집"
            />
          </div>

          {/* 꾸미기 슬롯 시설 (학교/정원/마당/분수) */}
          {Object.entries(VILLAGE_SLOT_POSITIONS).map(([slot, pos]) => {
            const placement = placements.find((p) => p.slot === (slot as VillageSlotType));
            const item = placement ? getItem(placement.itemId) : undefined;
            return (
              <GameObject key={slot} x={pos.x} y={pos.y} bob label={item?.name} onClick={() => navigate('/village/decorate')}>
                {item ? <span style={{ fontSize: 34 }}>{item.emoji}</span> : renderSlotFallback(slot as VillageSlotType, 60)}
              </GameObject>
            );
          })}

          {/* 마을 주민 */}
          {sceneResidents.map((r, i) => (
            <ResidentNPC key={r.id} x={20 + i * 15} y={66} resident={r} size={34} />
          ))}

          {/* 플레이어 캐릭터 */}
          <GameObject x={charPos.x} y={charPos.y}>
            <PlayerCharacter profile={profile} cosmetics={cosmetics} size={64} facing={facing} walking={walking} />
          </GameObject>

          <VirtualJoystick onMove={move} />
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
