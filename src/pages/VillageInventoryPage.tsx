import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Header from '../components/layout/Header';
import DecorationCard from '../components/village/DecorationCard';
import ResidentCard from '../components/village/ResidentCard';
import { RARITY_GRADIENT } from '../components/village/DecorationCard';
import { useAuthStore } from '../store/authStore';
import { useDecorationStore } from '../store/decorationStore';
import { useCharacterStore } from '../store/characterStore';
import { DECORATION_CATEGORY_LABELS, COSMETIC_SLOT_LABELS } from '../utils/villageRewards';

export default function VillageInventoryPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { items, residents, getInventory, getUserResidents } = useDecorationStore();
  const { getOwnedCosmetics, getProfile, ensureProfile, equipCosmetic, unequipCosmetic } = useCharacterStore();
  const [tab, setTab] = useState<'ITEMS' | 'RESIDENTS' | 'COSMETICS'>('ITEMS');

  if (!currentUser) return null;

  const inventory = getInventory(currentUser.id);
  const ownedItems = items.filter((i) => inventory.some((inv) => inv.itemId === i.id));
  const ownedResidentIds = new Set(getUserResidents(currentUser.id).map((r) => r.id));
  const ownedCosmetics = getOwnedCosmetics(currentUser.id);
  const profile = getProfile(currentUser.id) ?? ensureProfile(currentUser.id, currentUser.name);

  const cosmeticsBySlot = ownedCosmetics.reduce<Record<string, typeof ownedCosmetics>>((acc, c) => {
    (acc[c.slot] ??= []).push(c);
    return acc;
  }, {});

  const toggleEquip = (slot: string, cosmeticId: string) => {
    const current = profile.equipped[slot as keyof typeof profile.equipped];
    if (current === cosmeticId) {
      unequipCosmetic(currentUser.id, slot as any);
    } else {
      equipCosmetic(currentUser.id, slot as any, cosmeticId);
    }
  };

  const grouped = ownedItems.reduce<Record<string, typeof ownedItems>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="page-container">
      <Header title="🎒 보유함" showBack />

      <div className="content-area">
        <div className="flex gap-2 px-4 pt-4 pb-2">
          <button
            onClick={() => setTab('ITEMS')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              tab === 'ITEMS' ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🪑 장식 아이템 ({ownedItems.length})
          </button>
          <button
            onClick={() => setTab('RESIDENTS')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              tab === 'RESIDENTS' ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
            }`}
          >
            🐾 동물 도감 ({ownedResidentIds.size}/{residents.length})
          </button>
          <button
            onClick={() => setTab('COSMETICS')}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-bold transition-all ${
              tab === 'COSMETICS' ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
            }`}
          >
            👕 의상 ({ownedCosmetics.length})
          </button>
        </div>

        {tab === 'COSMETICS' && (
          <div className="px-4 pb-4 space-y-5">
            <button
              onClick={() => navigate('/character')}
              className="w-full bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold text-sm py-3 rounded-2xl shadow-md active:scale-95 transition-all"
            >
              🧑 캐릭터 꾸미기로 이동
            </button>
            {Object.entries(cosmeticsBySlot).map(([slot, slotCosmetics]) => (
              <div key={slot}>
                <p className="text-sm font-bold text-gray-700 mb-3">
                  {COSMETIC_SLOT_LABELS[slot] ?? slot} ({slotCosmetics.length})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {slotCosmetics.map((c, i) => {
                    const equipped = profile.equipped[slot as keyof typeof profile.equipped] === c.id;
                    return (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        onClick={() => toggleEquip(slot, c.id)}
                        className="cursor-pointer"
                      >
                        <div className={`bg-gradient-to-br ${RARITY_GRADIENT[c.rarity]} rounded-2xl aspect-square flex items-center justify-center text-white shadow-md relative overflow-hidden mb-1`}>
                          <div className="text-4xl">{c.emoji}</div>
                          {equipped && (
                            <div className="absolute top-2 left-2 bg-white/90 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <Check size={10} strokeWidth={3} /> 장착중
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-800 text-center">{c.name}</p>
                        <p className="text-[11px] text-center text-gray-400">{equipped ? '탭하여 해제' : '탭하여 장착'}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}

            {ownedCosmetics.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">👕</p>
                <p className="text-gray-500">아직 보유한 의상이 없어요</p>
                <p className="text-gray-400 text-xs mt-1">미션을 완료하고 상점에서 의상을 구매해보세요!</p>
              </div>
            )}
          </div>
        )}

        {tab === 'ITEMS' && (
          <div className="px-4 pb-4 space-y-5">
            {Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category}>
                <p className="text-sm font-bold text-gray-700 mb-3">
                  {DECORATION_CATEGORY_LABELS[category]} ({categoryItems.length})
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {categoryItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <DecorationCard item={item} />
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

            {ownedItems.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-gray-500">아직 보유한 아이템이 없어요</p>
                <p className="text-gray-400 text-xs mt-1">미션을 완료하고 상점에서 아이템을 구매해보세요!</p>
              </div>
            )}
          </div>
        )}

        {tab === 'RESIDENTS' && (
          <div className="px-4 pb-4">
            <p className="text-xs text-gray-400 mb-3">
              미션을 꾸준히 수행하면 업적을 통해 동물 주민을 만날 수 있어요.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {residents.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ResidentCard resident={r} owned={ownedResidentIds.has(r.id)} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
