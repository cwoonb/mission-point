import { useState } from 'react';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import CoinAnimation from '../components/animations/CoinAnimation';
import DecorationCard from '../components/village/DecorationCard';
import ResidentCard from '../components/village/ResidentCard';
import CosmeticCard from '../components/village/CosmeticCard';
import { useAuthStore } from '../store/authStore';
import { useDecorationStore } from '../store/decorationStore';
import { useVillageStore } from '../store/villageStore';
import { useCharacterStore } from '../store/characterStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint } from '../utils/helpers';
import { DECORATION_CATEGORY_LABELS, COSMETIC_SLOT_LABELS, RARITY_LABELS } from '../utils/villageRewards';
import type { CharacterCosmetic } from '../types';

const CATEGORY_TABS: { key: string; label: string }[] = [
  { key: 'ALL', label: '전체' },
  { key: 'HOUSE', label: DECORATION_CATEGORY_LABELS.HOUSE },
  { key: 'FURNITURE', label: DECORATION_CATEGORY_LABELS.FURNITURE },
  { key: 'TREE', label: DECORATION_CATEGORY_LABELS.TREE },
  { key: 'FLOWER', label: DECORATION_CATEGORY_LABELS.FLOWER },
  { key: 'ROAD', label: DECORATION_CATEGORY_LABELS.ROAD },
  { key: 'FENCE', label: DECORATION_CATEGORY_LABELS.FENCE },
  { key: 'SCHOOL', label: DECORATION_CATEGORY_LABELS.SCHOOL },
  { key: 'STUDY_TOOL', label: DECORATION_CATEGORY_LABELS.STUDY_TOOL },
  { key: 'PET', label: DECORATION_CATEGORY_LABELS.PET },
  { key: 'THEME', label: DECORATION_CATEGORY_LABELS.THEME },
  { key: 'COSTUME', label: '의상' },
  { key: 'RESIDENT', label: '동물 주민' },
];

export default function VillageShopPage() {
  const { currentUser, updateUserPoint } = useAuthStore();
  const { items, residents } = useDecorationStore();
  const { getUserResidents } = useDecorationStore();
  const { getVillage, ensureVillage } = useVillageStore();
  const { cosmetics, ownsCosmetic, purchaseCosmetic } = useCharacterStore();
  const { addTransaction } = usePointStore();
  const [activeCategory, setActiveCategory] = useState('ALL');

  const [selectedCosmetic, setSelectedCosmetic] = useState<CharacterCosmetic | null>(null);
  const [resultModal, setResultModal] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(false);

  if (!currentUser) return null;

  const village = getVillage(currentUser.id) ?? ensureVillage(currentUser.id, currentUser.name);
  const ownedResidentIds = new Set(getUserResidents(currentUser.id).map((r) => r.id));

  const handleCosmeticPurchase = () => {
    if (!selectedCosmetic) return;
    const result = purchaseCosmetic(currentUser.id, selectedCosmetic.id);
    if (result.success) {
      updateUserPoint(currentUser.id, -selectedCosmetic.requiredPoint);
      addTransaction(currentUser.id, -selectedCosmetic.requiredPoint, 'DECORATION_PURCHASE', `의상 구매: ${selectedCosmetic.name}`);
      setCoinTrigger(true);
      setPurchaseSuccess(true);
    } else {
      setPurchaseSuccess(false);
    }
    setResultMsg(result.message);
    setSelectedCosmetic(null);
    setResultModal(true);
  };

  if (activeCategory === 'COSTUME') {
    const enabledCosmetics = cosmetics.filter((c) => c.enabled);
    const ownedCosmetics = enabledCosmetics.filter((c) => ownsCosmetic(currentUser.id, c.id));
    const availableCosmetics = enabledCosmetics.filter((c) => !ownsCosmetic(currentUser.id, c.id) && c.requiredLevel <= village.level);
    const lockedCosmetics = enabledCosmetics.filter((c) => !ownsCosmetic(currentUser.id, c.id) && c.requiredLevel > village.level);

    return (
      <div className="page-container">
        <Header title="🏪 마을 상점" showBack />
        <CoinAnimation trigger={coinTrigger} onComplete={() => setCoinTrigger(false)} />
        <div className="content-area">
          <div className="mx-4 mt-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl p-4 text-white shadow-md">
            <p className="text-white/80 text-xs font-semibold">{village.name}</p>
            <p className="font-black text-xl">Lv.{village.level} · ⭐ {formatPoint(currentUser.point)}P</p>
          </div>

          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.key ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4 space-y-5">
            {availableCosmetics.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">✨ 구매 가능 ({availableCosmetics.length})</p>
                <div className="grid grid-cols-2 gap-4">
                  {availableCosmetics.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                      <CosmeticCard cosmetic={c} onClick={() => setSelectedCosmetic(c)} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {ownedCosmetics.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-700 mb-3">🎒 보유중 ({ownedCosmetics.length})</p>
                <div className="grid grid-cols-2 gap-4 opacity-80">
                  {ownedCosmetics.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                      <CosmeticCard cosmetic={c} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {lockedCosmetics.length > 0 && (
              <div>
                <p className="text-sm font-bold text-gray-400 mb-3">🔒 마을 레벨이 필요해요 ({lockedCosmetics.length})</p>
                <div className="grid grid-cols-2 gap-4 opacity-60">
                  {lockedCosmetics.map((c, i) => (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: i * 0.04 }}>
                      <CosmeticCard cosmetic={c} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 의상 구매 확인 모달 */}
        <Modal isOpen={selectedCosmetic !== null} onClose={() => setSelectedCosmetic(null)} title="🛍️ 의상 구매">
          {selectedCosmetic && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-5xl mb-3">{selectedCosmetic.emoji}</div>
                <p className="font-bold text-gray-800">{selectedCosmetic.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{COSMETIC_SLOT_LABELS[selectedCosmetic.slot]} · {RARITY_LABELS[selectedCosmetic.rarity]}</p>
                <p className="text-amber-500 font-black text-xl mt-1">{formatPoint(selectedCosmetic.requiredPoint)}P 차감</p>
              </div>
              <p className="text-gray-500 text-sm text-center">
                구매 후 포인트: {formatPoint(currentUser.point - selectedCosmetic.requiredPoint)}P
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setSelectedCosmetic(null)}>취소</Button>
                <Button variant="amber" disabled={currentUser.point < selectedCosmetic.requiredPoint} onClick={handleCosmeticPurchase}>구매하기</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* 결과 모달 */}
        <Modal isOpen={resultModal} onClose={() => setResultModal(false)} title={purchaseSuccess ? '🎉 구매 완료!' : '❌ 구매 실패'}>
          <div className="space-y-4 text-center">
            <div className="text-5xl">{purchaseSuccess ? '🎊' : '😢'}</div>
            <p className={`font-bold text-lg ${purchaseSuccess ? 'text-green-600' : 'text-red-500'}`}>{resultMsg}</p>
            {purchaseSuccess && (
              <p className="text-gray-500 text-sm">캐릭터 꾸미기에서 새 의상을 장착해보세요!</p>
            )}
            <Button fullWidth variant={purchaseSuccess ? 'success' : 'secondary'} onClick={() => setResultModal(false)}>확인</Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (activeCategory === 'RESIDENT') {
    return (
      <div className="page-container">
        <Header title="🏪 마을 상점" showBack />
        <div className="content-area">
          <div className="mx-4 mt-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl p-4 text-white shadow-md">
            <p className="text-white/80 text-xs font-semibold">{village.name}</p>
            <p className="font-black text-xl">Lv.{village.level} · ⭐ {formatPoint(currentUser.point)}P</p>
          </div>

          <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === cat.key ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="px-4 pb-4">
            <p className="text-sm font-bold text-gray-700 mb-3">
              🐾 동물 주민 도감 ({ownedResidentIds.size}/{residents.length})
            </p>
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
        </div>
      </div>
    );
  }

  const filtered = items
    .filter((i) => i.enabled)
    .filter((i) => activeCategory === 'ALL' || i.category === activeCategory);

  const owned = filtered.filter((i) => useDecorationStore.getState().ownsItem(currentUser.id, i.id));
  const available = filtered.filter(
    (i) => !owned.includes(i) && i.requiredLevel <= village.level
  );
  const locked = filtered.filter((i) => !owned.includes(i) && i.requiredLevel > village.level);

  return (
    <div className="page-container">
      <Header title="🏪 마을 상점" showBack />

      <div className="content-area">
        <div className="mx-4 mt-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-3xl p-4 text-white shadow-md">
          <p className="text-white/80 text-xs font-semibold">{village.name}</p>
          <p className="font-black text-xl">Lv.{village.level} · ⭐ {formatPoint(currentUser.point)}P</p>
          <p className="text-white/70 text-xs mt-1">
            마을 레벨이 오르면 더 멋진 아이템을 구매할 수 있어요
          </p>
        </div>

        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.key ? 'bg-emerald-400 text-white shadow-md' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-5">
          {available.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">✨ 구매 가능 ({available.length})</p>
              <div className="grid grid-cols-2 gap-4">
                {available.map((item, i) => (
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
          )}

          {owned.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">🎒 보유중 ({owned.length})</p>
              <div className="grid grid-cols-2 gap-4 opacity-80">
                {owned.map((item, i) => (
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
          )}

          {locked.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-400 mb-3">🔒 마을 레벨이 필요해요 ({locked.length})</p>
              <div className="grid grid-cols-2 gap-4 opacity-60">
                {locked.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DecorationCard item={item} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">아이템이 없어요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
