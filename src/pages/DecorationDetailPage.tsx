import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Sparkles, TrendingUp } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CoinAnimation from '../components/animations/CoinAnimation';
import { RARITY_GRADIENT } from '../components/village/DecorationCard';
import { useAuthStore } from '../store/authStore';
import { useDecorationStore } from '../store/decorationStore';
import { useVillageStore } from '../store/villageStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint } from '../utils/helpers';
import { DECORATION_CATEGORY_LABELS, RARITY_LABELS } from '../utils/villageRewards';

export default function DecorationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, updateUserPoint } = useAuthStore();
  const { getItem, ownsItem, purchaseItem } = useDecorationStore();
  const { getVillage, ensureVillage } = useVillageStore();
  const { addTransaction } = usePointStore();

  const [confirmModal, setConfirmModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(false);

  const item = getItem(id!);

  if (!item || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">아이템을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const village = getVillage(currentUser.id) ?? ensureVillage(currentUser.id, currentUser.name);
  const owned = ownsItem(currentUser.id, item.id);
  const meetsLevel = village.level >= item.requiredLevel;
  const canAfford = currentUser.point >= item.requiredPoint;
  const canPurchase = !owned && meetsLevel && canAfford;

  const handlePurchase = () => {
    const result = purchaseItem(currentUser.id, item.id);
    if (result.success) {
      updateUserPoint(currentUser.id, -item.requiredPoint);
      addTransaction(currentUser.id, -item.requiredPoint, 'DECORATION_PURCHASE', `장식 구매: ${item.name}`);
      setCoinTrigger(true);
      setSuccess(true);
    } else {
      setSuccess(false);
    }
    setResultMsg(result.message);
    setConfirmModal(false);
    setResultModal(true);
  };

  const goBack = () => navigate('/village/shop');

  return (
    <div className="page-container">
      <Header title="🏷️ 아이템 상세" showBack />
      <CoinAnimation trigger={coinTrigger} onComplete={() => setCoinTrigger(false)} />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 아이템 비주얼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${RARITY_GRADIENT[item.rarity]} rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden`}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-8xl mb-4"
          >
            {item.emoji}
          </motion.div>
          <h2 className="font-black text-2xl leading-tight">{item.name}</h2>
          <div className="mt-4 bg-white/20 rounded-2xl py-2 px-4 inline-flex items-center gap-2">
            <Star size={16} className="fill-white text-white" />
            <span className="font-black text-xl">{formatPoint(item.requiredPoint)}P</span>
          </div>
        </motion.div>

        {/* 상세 정보 */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1">📋 아이템 설명</p>
            <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-600 font-semibold mb-1">필요 포인트</p>
              <p className="text-amber-700 font-black text-base">{formatPoint(item.requiredPoint)}P</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-1">카테고리</p>
              <p className="text-blue-700 font-bold text-sm">{DECORATION_CATEGORY_LABELS[item.category]}</p>
            </div>
            <div className={`rounded-2xl p-3 text-center ${meetsLevel ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-semibold mb-1 ${meetsLevel ? 'text-green-600' : 'text-red-500'}`}>
                필요 레벨
              </p>
              <p className={`font-black text-base flex items-center justify-center gap-1 ${meetsLevel ? 'text-green-700' : 'text-red-600'}`}>
                <TrendingUp size={12} />
                Lv.{item.requiredLevel}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-violet-400" />
              <span className="text-xs text-gray-500">희귀도</span>
            </div>
            <span className="font-black text-gray-700">{RARITY_LABELS[item.rarity]}</span>
          </div>

          {/* 내 포인트 */}
          <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">내 포인트</p>
              <p className="font-black text-gray-800">⭐ {formatPoint(currentUser.point)}P</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">구매 후</p>
              <p className={`font-black ${canAfford ? 'text-gray-700' : 'text-red-500'}`}>
                {formatPoint(Math.max(0, currentUser.point - item.requiredPoint))}P
              </p>
            </div>
          </div>

          {!meetsLevel && (
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-red-500 text-sm font-semibold">
                🔒 마을 레벨 {item.requiredLevel} 이상부터 구매할 수 있어요 (현재 Lv.{village.level})
              </p>
            </div>
          )}

          {meetsLevel && !canAfford && !owned && (
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-red-500 text-sm font-semibold">
                ⚠️ 포인트가 {formatPoint(item.requiredPoint - currentUser.point)}P 부족합니다
              </p>
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          variant={canPurchase ? 'amber' : 'secondary'}
          disabled={!canPurchase}
          onClick={() => setConfirmModal(true)}
          className="rounded-3xl"
        >
          {owned ? '✅ 보유중' : !meetsLevel ? '🔒 레벨 부족' : !canAfford ? '포인트 부족' : '🛍️ 구매하기'}
        </Button>

        {owned && (
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigate('/village/decorate')} className="rounded-3xl">
            🎨 마을에 배치하러 가기
          </Button>
        )}
      </div>

      {/* 구매 확인 모달 */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="🛍️ 아이템 구매">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-3">{item.emoji}</div>
            <p className="font-bold text-gray-800">{item.name}</p>
            <p className="text-amber-500 font-black text-xl mt-1">{formatPoint(item.requiredPoint)}P 차감</p>
          </div>
          <p className="text-gray-500 text-sm text-center">
            구매 후 포인트: {formatPoint(currentUser.point - item.requiredPoint)}P
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>취소</Button>
            <Button variant="amber" onClick={handlePurchase}>구매하기</Button>
          </div>
        </div>
      </Modal>

      {/* 결과 모달 */}
      <Modal isOpen={resultModal} onClose={() => { setResultModal(false); if (success) goBack(); }} title={success ? '🎉 구매 완료!' : '❌ 구매 실패'}>
        <div className="space-y-4 text-center">
          <div className="text-5xl">{success ? '🎊' : '😢'}</div>
          <p className={`font-bold text-lg ${success ? 'text-green-600' : 'text-red-500'}`}>{resultMsg}</p>
          {success && (
            <p className="text-gray-500 text-sm">
              남은 포인트: {formatPoint(currentUser.point)}P · 보유함에서 마을에 배치해보세요!
            </p>
          )}
          <Button fullWidth variant={success ? 'success' : 'secondary'} onClick={() => { setResultModal(false); if (success) goBack(); }}>
            확인
          </Button>
        </div>
      </Modal>
    </div>
  );
}
