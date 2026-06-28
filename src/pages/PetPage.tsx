import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Pencil, Sparkles, Egg as EggIcon } from 'lucide-react';
import { clsx } from 'clsx';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { PetSprite } from '../components/pet/PetSprite';
import { EggSprite } from '../components/pet/EggSprite';
import { useAuthStore } from '../store/authStore';
import { usePetStore } from '../store/petStore';
import { formatPoint } from '../utils/helpers';
import {
  RARITY_LABEL,
  RARITY_EMOJI,
  RARITY_COLOR,
  SPECIES_LABEL,
  EGG_COST,
  EGG_LABEL,
  FEED_COST,
  MAX_STAGE,
  nextEvolutionInfo,
} from '../config/pets';
import type { Egg, EggType, Pet, PetRarity } from '../types';

const EGG_DISPLAY_RARITY: Record<EggType, PetRarity> = {
  basic: 'common',
  premium: 'magic',
};

export default function PetPage() {
  const { currentUser } = useAuthStore();
  const {
    loadPets,
    buyEgg,
    hatchEgg,
    feed,
    renamePet,
    setActivePet,
    getPetsByOwner,
    getEggsByOwner,
    getActivePet,
    getDex,
  } = usePetStore();

  const [toast, setToast] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [hatchingEggId, setHatchingEggId] = useState<string | null>(null);
  const [hatchPhase, setHatchPhase] = useState<'shaking' | 'revealed'>('shaking');
  const [hatchedPet, setHatchedPet] = useState<Pet | null>(null);

  useEffect(() => {
    if (currentUser) loadPets(currentUser.id);
  }, [currentUser?.id, loadPets]);

  if (!currentUser) return null;

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  };

  const myPets = getPetsByOwner(currentUser.id);
  const myEggs = getEggsByOwner(currentUser.id);
  const activePet = getActivePet(currentUser.id);
  const dex = getDex(currentUser.id);
  const hatchingEgg = myEggs.find((e) => e.id === hatchingEggId);

  const evo = activePet ? nextEvolutionInfo(activePet.rarity, activePet.stageIndex, activePet.totalExp) : null;
  const growthProgress = activePet
    ? evo
      ? Math.min(100, Math.round(((evo.current ?? 0) / Math.max(1, evo.required)) * 100))
      : 100
    : 0;

  const openRename = () => {
    if (!activePet) return;
    setRenameValue(activePet.name);
    setRenameOpen(true);
  };

  const confirmRename = () => {
    if (!activePet) return;
    const name = renameValue.trim();
    if (!name) return;
    renamePet(activePet.id, name);
    setRenameOpen(false);
  };

  const handleFeed = () => {
    if (!activePet) return;
    const result = feed(activePet.id);
    showToast(result.message);
  };

  const handleBuyEgg = (type: EggType) => {
    const result = buyEgg(currentUser.id, type);
    showToast(result.message);
  };

  const startHatch = (egg: Egg) => {
    setHatchingEggId(egg.id);
    setHatchPhase('shaking');
    setHatchedPet(null);
    setTimeout(() => {
      const result = hatchEgg(egg.id);
      if (result.success && result.pet) {
        setHatchedPet(result.pet);
        setHatchPhase('revealed');
      } else {
        setHatchingEggId(null);
        showToast(result.message);
      }
    }, 1400);
  };

  const closeHatch = () => {
    setHatchingEggId(null);
    setHatchedPet(null);
  };

  return (
    <div className="page-container">
      <Header title="🐾 마이펫" showBack />

      <div className="content-area px-4 py-4 space-y-4 pb-8">
        {/* 메인 펫 카드 */}
        <div className="bg-gradient-to-br from-amber-100 via-rose-50 to-sky-100 rounded-3xl p-5 shadow-sm">
          {activePet ? (
            <>
              <div className="flex flex-col items-center">
                <div className="w-36 h-36">
                  <PetSprite
                    species={activePet.species}
                    rarity={activePet.rarity}
                    stageIndex={activePet.stageIndex}
                    hatched={activePet.hatched}
                    className="w-full h-full"
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <h2 className="font-black text-gray-800 text-lg">{activePet.name || SPECIES_LABEL[activePet.species]}</h2>
                  <button onClick={openRename} className="p-1 rounded-lg bg-white/70">
                    <Pencil size={12} className="text-gray-400" />
                  </button>
                </div>
                <p
                  className={clsx(
                    'text-[11px] font-bold px-2 py-0.5 rounded-full mt-1',
                    RARITY_COLOR[activePet.rarity].bg,
                    RARITY_COLOR[activePet.rarity].text
                  )}
                >
                  {RARITY_EMOJI[activePet.rarity]} {RARITY_LABEL[activePet.rarity]} · {SPECIES_LABEL[activePet.species]}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                    <span>🌱 성장 ({activePet.stageIndex} / {MAX_STAGE[activePet.rarity]} 단계)</span>
                    <span>{evo ? `${evo.current} / ${evo.required} EXP` : '최고 단계예요!'}</span>
                  </div>
                  <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${growthProgress}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-emerald-400 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1">
                    <span>💗 행복도</span>
                    <span>{activePet.happiness} / 100</span>
                  </div>
                  <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${activePet.happiness}%` }}
                      transition={{ duration: 0.6 }}
                      className="h-full bg-pink-400 rounded-full"
                    />
                  </div>
                </div>
              </div>

              {activePet.happiness < 50 && (
                <p className="text-center text-xs text-rose-500 font-semibold mt-3">
                  {activePet.name || '얘'}가 심심해해요. 미션을 완료하거나 밥을 줘서 챙겨줄까요?
                </p>
              )}

              <Button fullWidth size="lg" variant="amber" className="rounded-2xl mt-4" onClick={handleFeed}>
                <Heart size={18} className="mr-1.5 fill-white" /> 밥 주기 (-{FEED_COST}P)
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-5xl mb-2">🥚</p>
              <p className="font-bold text-gray-700">아직 부화한 펫이 없어요</p>
              <p className="text-xs text-gray-400 mt-1">아래 알을 눌러서 부화시켜 보세요!</p>
            </div>
          )}
        </div>

        {/* 보유 펫 목록 */}
        {myPets.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">🐾 내 동물 친구들 ({myPets.length})</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
              {myPets.map((pet) => (
                <button
                  key={pet.id}
                  onClick={() => setActivePet(currentUser.id, pet.id)}
                  className={clsx(
                    'flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl py-3 px-3 transition-all w-20',
                    pet.id === activePet?.id ? 'bg-emerald-50 ring-2 ring-emerald-300' : 'bg-white shadow-sm'
                  )}
                >
                  <div className="w-12 h-12">
                    <PetSprite species={pet.species} rarity={pet.rarity} stageIndex={pet.stageIndex} hatched={pet.hatched} className="w-full h-full" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-700 truncate w-full text-center">
                    {pet.name || SPECIES_LABEL[pet.species]}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 보유한 알 */}
        {myEggs.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">🥚 부화를 기다리는 알 ({myEggs.length})</p>
            <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
              {myEggs.map((egg) => (
                <button
                  key={egg.id}
                  onClick={() => startHatch(egg)}
                  className="flex-shrink-0 flex flex-col items-center gap-1 rounded-2xl py-3 px-3 bg-white shadow-sm w-20"
                >
                  <div className="w-12 h-12">
                    <EggSprite rarity={EGG_DISPLAY_RARITY[egg.type]} className="w-full h-full" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-700">{EGG_LABEL[egg.type]}</p>
                  <p className="text-[9px] text-emerald-500 font-bold">부화하기</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 새 알 구매 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-gray-700 font-bold text-sm">새로운 알 받기</p>
            <p className="text-gray-400 text-[11px]">내 포인트: {formatPoint(currentUser.point)}P</p>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleBuyEgg('basic')}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 bg-gray-50 border border-gray-100"
            >
              <div className="w-12 h-12"><EggSprite rarity="common" className="w-full h-full" /></div>
              <p className="text-xs font-bold text-gray-700">{EGG_LABEL.basic}</p>
              <p className="text-[10px] text-gray-400">희귀 등급 확률 UP!</p>
              <Button variant="success" size="sm" className="mt-1">
                <Sparkles size={13} className="mr-1" /> -{EGG_COST.basic}P
              </Button>
            </button>
            <button
              onClick={() => handleBuyEgg('premium')}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3 bg-violet-50 border border-violet-100"
            >
              <div className="w-12 h-12"><EggSprite rarity="magic" className="w-full h-full" /></div>
              <p className="text-xs font-bold text-gray-700">{EGG_LABEL.premium}</p>
              <p className="text-[10px] text-violet-400">레어 등급 이상 확률 UP!</p>
              <Button variant="amber" size="sm" className="mt-1">
                <Sparkles size={13} className="mr-1" /> -{EGG_COST.premium}P
              </Button>
            </button>
          </div>
        </div>

        {/* 도감 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
            <EggIcon size={14} className="text-gray-400" /> 펫 도감 ({dex.filter((d) => d.owned).length} / {dex.length})
          </p>
          <div className="grid grid-cols-4 gap-2">
            {dex.map((entry) => (
              <div
                key={entry.species}
                className={clsx(
                  'rounded-2xl p-2 flex flex-col items-center gap-1',
                  entry.owned ? RARITY_COLOR[entry.rarity].bg : 'bg-gray-100'
                )}
              >
                <div className={clsx('w-12 h-12', !entry.owned && 'opacity-30 grayscale brightness-0')}>
                  <PetSprite species={entry.species} rarity={entry.rarity} stageIndex={1} hatched className="w-full h-full" />
                </div>
                <p className="text-[10px] font-bold text-gray-600 truncate w-full text-center">
                  {entry.owned ? SPECIES_LABEL[entry.species] : '???'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이름 변경 모달 */}
      <Modal isOpen={renameOpen} onClose={() => setRenameOpen(false)} title="✏️ 이름 바꾸기">
        <div className="space-y-4">
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={10}
            className="w-full bg-gray-100 border-0 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
          <Button fullWidth variant="success" onClick={confirmRename} disabled={!renameValue.trim()}>저장하기</Button>
        </div>
      </Modal>

      {/* 알 부화 모달 */}
      <Modal isOpen={!!hatchingEggId} onClose={hatchPhase === 'revealed' ? closeHatch : () => {}} title="🥚 알 부화">
        <div className="flex flex-col items-center py-4">
          {hatchPhase === 'shaking' && hatchingEgg && (
            <>
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.05, 1, 1.05, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-32 h-32"
              >
                <EggSprite rarity={EGG_DISPLAY_RARITY[hatchingEgg.type]} className="w-full h-full" />
              </motion.div>
              <p className="mt-4 text-sm text-gray-500 font-semibold">두근두근... 알이 흔들리고 있어요!</p>
            </>
          )}

          {hatchPhase === 'revealed' && hatchedPet && (
            <motion.div
              initial={{ scale: 0, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-36 h-36">
                <PetSprite species={hatchedPet.species} rarity={hatchedPet.rarity} stageIndex={1} hatched className="w-full h-full" />
              </div>
              <p
                className={clsx(
                  'mt-3 text-xs font-bold px-2 py-0.5 rounded-full',
                  RARITY_COLOR[hatchedPet.rarity].bg,
                  RARITY_COLOR[hatchedPet.rarity].text
                )}
              >
                {RARITY_EMOJI[hatchedPet.rarity]} {RARITY_LABEL[hatchedPet.rarity]}
              </p>
              <p className="mt-1 font-black text-lg text-gray-800">{SPECIES_LABEL[hatchedPet.species]}</p>
              <p className="text-xs text-gray-400 mt-0.5">새 친구가 도감에 추가됐어요!</p>
              <Button fullWidth variant="success" className="mt-4" onClick={closeHatch}>좋아요!</Button>
            </motion.div>
          )}
        </div>
      </Modal>

      {/* 토스트 메시지 */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="fixed bottom-24 left-4 right-4 max-w-xs mx-auto bg-gray-800 text-white font-bold text-sm px-4 py-3 rounded-2xl shadow-lg z-50 text-center"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
