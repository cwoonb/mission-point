import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Hand, Heart, PartyPopper, Sparkles, Armchair, Palette, Check, RotateCw, FlipHorizontal2, Trash2, Store, Sun, CloudRain, Star } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import HomeCanvas, { type HomeCanvasHandle } from '../components/game/phaser/HomeCanvas';
import type { HomeSceneData, PlacementView, TimeOfDay, Weather } from '../components/game/phaser/HomeScene';
import { useAuthStore } from '../store/authStore';
import { usePointStore } from '../store/pointStore';
import { usePetStore } from '../store/petStore';
import { useHomeStore } from '../store/homeStore';
import { DECOR_ITEMS, DECOR_BY_ID, DECOR_CATEGORY_LABEL, type DecorCategory } from '../config/decor';
import { SPECIES_LABEL } from '../config/pets';
import { formatPoint } from '../utils/helpers';

function computeTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 6 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'evening';
  return 'night';
}

const TIME_CYCLE: TimeOfDay[] = ['day', 'evening', 'night'];
const TIME_LABEL: Record<TimeOfDay, string> = { day: '낮', evening: '저녁', night: '밤' };

export default function SpacePage() {
  const { currentUser, updateUserPoint } = useAuthStore();
  const { addTransaction } = usePointStore();
  const { getActivePet, loadPets } = usePetStore();
  const home = useHomeStore();
  const placementsRaw = useHomeStore((s) => s.placements);

  const canvasRef = useRef<HomeCanvasHandle>(null);
  const [ready, setReady] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopCat, setShopCat] = useState<DecorCategory>('FURNITURE');
  const [time, setTime] = useState<TimeOfDay>(computeTimeOfDay());
  const [weather, setWeather] = useState<Weather>('clear');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (currentUser) loadPets(currentUser.id).finally(() => setReady(true));
  }, [currentUser?.id, loadPets]);

  const activePet = currentUser ? getActivePet(currentUser.id) : undefined;

  const myPlacements: PlacementView[] = useMemo(
    () =>
      placementsRaw
        .filter((p) => p.ownerId === currentUser?.id)
        .map((p) => ({ id: p.id, itemId: p.itemId, x: p.x, y: p.y, rotation: p.rotation, flipX: p.flipX })),
    [placementsRaw, currentUser?.id]
  );

  const sceneData: HomeSceneData = useMemo(
    () => ({
      pet: activePet ? { species: activePet.species, name: activePet.name } : undefined,
      placements: myPlacements,
      timeOfDay: time,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready]
  );

  // 배치 변경 → 씬 반영
  useEffect(() => { canvasRef.current?.setPlacements(myPlacements); }, [myPlacements]);

  if (!currentUser) return null;

  const inventory = home.getInventory(currentUser.id);
  const ownedEntries = Object.entries(inventory).filter(([, n]) => n > 0);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 1800); };

  const handleBuy = (itemId: string) => {
    const item = DECOR_BY_ID[itemId];
    if (currentUser.point < item.price) { flash('포인트가 부족해요!'); return; }
    updateUserPoint(currentUser.id, -item.price);
    addTransaction(currentUser.id, -item.price, 'DECORATION_PURCHASE', `${item.name} 구매`);
    home.buyToInventory(currentUser.id, itemId);
    flash(`${item.name} 구매 완료! 보유함에서 배치하세요`);
  };

  const handlePlaceStart = (itemId: string) => {
    setShopOpen(false);
    canvasRef.current?.startPlacing(itemId);
    flash('마당을 탭해서 배치하세요');
  };

  const onPlace = (itemId: string, x: number, y: number) => {
    home.placeFromInventory(currentUser.id, itemId, x, y);
  };
  const onMove = (id: string, x: number, y: number) => home.movePlacement(id, x, y);

  const enterEdit = () => { setEditMode(true); setSelectedId(null); };
  const exitEdit = () => { setEditMode(false); setSelectedId(null); canvasRef.current?.clearSelection(); canvasRef.current?.cancelPlacing(); };

  const cycleTime = () => {
    const next = TIME_CYCLE[(TIME_CYCLE.indexOf(time) + 1) % 3];
    setTime(next); canvasRef.current?.applyTimeOfDay(next);
  };
  const toggleWeather = () => {
    const next: Weather = weather === 'clear' ? 'rain' : 'clear';
    setWeather(next); canvasRef.current?.setWeather(next);
  };

  return (
    <div className="page-container">
      <Header title="🏡 내 공간" showBack={false} />

      <div className="content-area px-4 py-3 space-y-3">
        {/* 상단 정보 */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm font-black text-gray-700">
            {activePet ? `${activePet.name || SPECIES_LABEL[activePet.species]}와 함께 🐾` : '나만의 아늑한 공간'}
          </p>
          <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-white rounded-full px-3 py-1 shadow-sm">
            <Star size={13} className="fill-amber-400 text-amber-400" /> {formatPoint(currentUser.point)}P
          </span>
        </div>

        {/* 게임 캔버스 */}
        {ready ? (
          <HomeCanvas
            ref={canvasRef}
            data={sceneData}
            editMode={editMode}
            onPlace={onPlace}
            onMove={onMove}
            onSelect={setSelectedId}
            onPetTap={() => flash(`${activePet?.name || '펫'}이(가) 좋아해요! 💕`)}
            onHouseTap={() => flash('아늑한 우리 집 🏠')}
            height={480}
          />
        ) : (
          <div className="rounded-3xl bg-emerald-100 flex items-center justify-center" style={{ height: 480 }}>
            <p className="text-emerald-500 font-bold animate-pulse">공간을 불러오는 중...</p>
          </div>
        )}

        {/* 시간/날씨 토글 */}
        <div className="flex gap-2">
          <button onClick={cycleTime} className="flex-1 bg-white rounded-2xl py-2 shadow-sm flex items-center justify-center gap-1.5 text-sm font-bold text-gray-600 active:scale-95 transition-transform">
            <Sun size={15} className="text-amber-500" /> {TIME_LABEL[time]}
          </button>
          <button onClick={toggleWeather} className="flex-1 bg-white rounded-2xl py-2 shadow-sm flex items-center justify-center gap-1.5 text-sm font-bold text-gray-600 active:scale-95 transition-transform">
            <CloudRain size={15} className={weather === 'rain' ? 'text-sky-500' : 'text-gray-300'} /> {weather === 'rain' ? '비' : '맑음'}
          </button>
        </div>

        {!editMode ? (
          <>
            {/* 포즈 / 감정 */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-1.5 px-1">포즈 & 감정</p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { icon: Hand, label: '인사', fn: () => canvasRef.current?.setPose('wave') },
                  { icon: Armchair, label: '앉기', fn: () => canvasRef.current?.setPose('sit') },
                  { icon: PartyPopper, label: '기뻐', fn: () => canvasRef.current?.setPose('cheer') },
                  { icon: Heart, label: '하트', fn: () => canvasRef.current?.playEmote('heart') },
                  { icon: Sparkles, label: '놀람', fn: () => canvasRef.current?.playEmote('excl') },
                ].map(({ icon: Icon, label, fn }) => (
                  <button key={label} onClick={fn} className="bg-white rounded-2xl py-2.5 shadow-sm flex flex-col items-center gap-1 active:scale-90 transition-transform">
                    <Icon size={18} className="text-emerald-500" />
                    <span className="text-[10px] font-bold text-gray-500">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button fullWidth size="lg" variant="success" className="rounded-2xl" onClick={enterEdit}>
              <Palette size={18} className="mr-1.5" /> 꾸미기 모드
            </Button>
          </>
        ) : (
          <>
            {/* 편집 모드 컨트롤 */}
            {selectedId && (
              <div className="bg-white rounded-2xl p-2 shadow-sm flex items-center justify-around">
                <button onClick={() => home.rotatePlacement(selectedId)} className="flex flex-col items-center gap-0.5 px-3 py-1 active:scale-90">
                  <RotateCw size={18} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500">회전</span>
                </button>
                <button onClick={() => home.flipPlacement(selectedId)} className="flex flex-col items-center gap-0.5 px-3 py-1 active:scale-90">
                  <FlipHorizontal2 size={18} className="text-gray-600" /><span className="text-[10px] font-bold text-gray-500">뒤집기</span>
                </button>
                <button onClick={() => { home.removePlacement(selectedId); setSelectedId(null); canvasRef.current?.clearSelection(); }} className="flex flex-col items-center gap-0.5 px-3 py-1 active:scale-90">
                  <Trash2 size={18} className="text-red-500" /><span className="text-[10px] font-bold text-red-400">삭제</span>
                </button>
              </div>
            )}

            {/* 보유함 (배치) */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-1.5 px-1">보유함 — 탭해서 배치</p>
              {ownedEntries.length === 0 ? (
                <p className="text-xs text-gray-400 bg-white rounded-2xl py-4 text-center shadow-sm">상점에서 아이템을 구매해보세요</p>
              ) : (
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                  {ownedEntries.map(([itemId, count]) => {
                    const item = DECOR_BY_ID[itemId];
                    return (
                      <button key={itemId} onClick={() => handlePlaceStart(itemId)}
                        className="flex-shrink-0 bg-white rounded-2xl px-3 py-2 shadow-sm text-center min-w-[64px] active:scale-90 transition-transform">
                        <div className="text-2xl">{item.emoji}</div>
                        <p className="text-[10px] font-bold text-gray-600 mt-0.5">{item.name}</p>
                        <p className="text-[9px] text-emerald-500 font-bold">x{count}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button fullWidth variant="amber" className="rounded-2xl" onClick={() => setShopOpen(true)}>
                <Store size={18} className="mr-1.5" /> 상점
              </Button>
              <Button fullWidth variant="success" className="rounded-2xl" onClick={exitEdit}>
                <Check size={18} className="mr-1.5" /> 완료
              </Button>
            </div>
            <p className="text-center text-[11px] text-gray-400">아이템을 드래그해 옮기고, 탭하면 회전/삭제할 수 있어요</p>
          </>
        )}
      </div>

      {/* 상점 모달 */}
      <Modal isOpen={shopOpen} onClose={() => setShopOpen(false)} title="🛒 꾸미기 상점">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-2">
          {(Object.keys(DECOR_CATEGORY_LABEL) as DecorCategory[]).map((c) => (
            <button key={c} onClick={() => setShopCat(c)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${shopCat === c ? 'bg-emerald-500 text-white shadow' : 'bg-gray-100 text-gray-500'}`}>
              {DECOR_CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto">
          {DECOR_ITEMS.filter((i) => i.category === shopCat).map((item) => {
            const owned = home.getOwnedCount(currentUser.id, item.id);
            return (
              <div key={item.id} className="bg-gray-50 rounded-2xl p-3 flex flex-col items-center">
                <div className="text-3xl mb-1">{item.emoji}</div>
                <p className="text-xs font-bold text-gray-700">{item.name}</p>
                <p className="text-[11px] text-amber-600 font-bold mb-2">⭐ {item.price}P{owned > 0 ? ` · 보유 ${owned}` : ''}</p>
                <button onClick={() => handleBuy(item.id)} disabled={currentUser.point < item.price}
                  className="w-full bg-emerald-500 text-white text-xs font-bold py-1.5 rounded-xl active:scale-95 transition-transform disabled:opacity-40">
                  구매
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* 토스트 */}
      {toast && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 right-4 max-w-xs mx-auto bg-gray-800/90 text-white text-sm font-bold px-4 py-2.5 rounded-2xl shadow-lg z-50 text-center">
          {toast}
        </motion.div>
      )}
    </div>
  );
}
