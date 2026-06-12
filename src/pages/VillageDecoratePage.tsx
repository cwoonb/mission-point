import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';
import { useVillageStore } from '../store/villageStore';
import { useDecorationStore } from '../store/decorationStore';
import { VILLAGE_SLOT_LABELS, getZoneForSlot } from '../utils/villageRewards';
import type { VillageSlotType, VillageZone } from '../types';

const PLACEABLE_SLOTS: VillageSlotType[] = ['HOUSE', 'GARDEN', 'YARD', 'PATH', 'SCHOOL', 'WINDOW', 'BED', 'DESK', 'BOOKSHELF', 'RUG', 'PLANT', 'INTERIOR'];

const SLOT_FALLBACK_EMOJI: Record<VillageSlotType, string> = {
  HOUSE: '🏚️',
  INTERIOR: '🪑',
  YARD: '🌿',
  GARDEN: '🌱',
  PATH: '⬜',
  SCHOOL: '🏫',
  RESIDENT: '🐾',
  BED: '🛏️',
  DESK: '🪑',
  BOOKSHELF: '📚',
  RUG: '🟫',
  WINDOW: '🪟',
  PLANT: '🪴',
};

export default function VillageDecoratePage() {
  const { currentUser } = useAuthStore();
  const { getVillage, ensureVillage, getPlacements, placeItem, removePlacement } = useVillageStore();
  const { items, getInventory } = useDecorationStore();
  const [activeSlot, setActiveSlot] = useState<VillageSlotType | null>(null);
  const [searchParams] = useSearchParams();

  if (!currentUser) return null;

  const village = getVillage(currentUser.id) ?? ensureVillage(currentUser.id, currentUser.name);
  const placements = getPlacements(currentUser.id);
  const placementBySlot = new Map(placements.map((p) => [p.slot, p]));
  const inventory = getInventory(currentUser.id);
  const ownedItemIds = new Set(inventory.map((inv) => inv.itemId));

  const zoneParam = searchParams.get('zone') as VillageZone | null;
  const slotsToShow = zoneParam ? PLACEABLE_SLOTS.filter((s) => getZoneForSlot(s) === zoneParam) : PLACEABLE_SLOTS;
  const pageTitle = zoneParam === 'HOUSE_INTERIOR' ? '🏠 집 꾸미기' : '🎨 마을 꾸미기';

  const itemsForSlot = (slot: VillageSlotType) =>
    items.filter((i) => i.slot === slot && ownedItemIds.has(i.id));

  const handleSelect = (itemId: string) => {
    if (!activeSlot) return;
    placeItem(currentUser.id, activeSlot, itemId);
    setActiveSlot(null);
  };

  const handleRemove = (slot: VillageSlotType) => {
    removePlacement(currentUser.id, slot);
  };

  return (
    <div className="page-container">
      <Header title={pageTitle} showBack />

      <div className="content-area px-4 py-4 space-y-3">
        <p className="text-sm text-gray-500">
          슬롯을 눌러 보유한 아이템으로 꾸며보세요. 자유 배치 모드는 추후 추가될 예정이에요.
        </p>

        {slotsToShow.map((slot, i) => {
          const placement = placementBySlot.get(slot);
          const placedItem = placement ? items.find((it) => it.id === placement.itemId) : undefined;
          const candidates = itemsForSlot(slot);

          return (
            <motion.div
              key={slot}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                {placedItem?.emoji ?? SLOT_FALLBACK_EMOJI[slot]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-400">{VILLAGE_SLOT_LABELS[slot]}</p>
                <p className="font-bold text-gray-800 truncate">{placedItem?.name ?? '비어있음'}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {placedItem && (
                  <button
                    onClick={() => handleRemove(slot)}
                    className="p-2 rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200"
                  >
                    <X size={16} />
                  </button>
                )}
                <Button
                  size="sm"
                  variant={candidates.length > 0 ? 'success' : 'secondary'}
                  disabled={candidates.length === 0}
                  onClick={() => setActiveSlot(slot)}
                >
                  {candidates.length > 0 ? '변경' : '아이템 없음'}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <Modal
        isOpen={activeSlot !== null}
        onClose={() => setActiveSlot(null)}
        title={activeSlot ? `${VILLAGE_SLOT_LABELS[activeSlot]} 아이템 선택` : ''}
      >
        <div className="grid grid-cols-3 gap-3">
          {activeSlot &&
            itemsForSlot(activeSlot).map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className="bg-gray-50 rounded-2xl p-3 text-center hover:bg-emerald-50 active:scale-95 transition-all"
              >
                <div className="text-3xl mb-1">{item.emoji}</div>
                <p className="text-xs font-bold text-gray-700 truncate">{item.name}</p>
              </button>
            ))}
        </div>
      </Modal>

      <div className="px-4 pb-4">
        <p className="text-center text-xs text-gray-400">
          현재 마을 레벨 Lv.{village.level} · 더 많은 아이템은 상점에서 만나보세요 🏪
        </p>
      </div>
    </div>
  );
}
