import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Package } from 'lucide-react';
import Header from '../components/layout/Header';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CoinAnimation from '../components/animations/CoinAnimation';
import { useAuthStore } from '../store/authStore';
import { useShopStore } from '../store/shopStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint } from '../utils/helpers';

export default function CouponDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, updateUserPoint } = useAuthStore();
  const { getCoupon, exchangeCoupon } = useShopStore();
  const { addTransaction } = usePointStore();

  const [confirmModal, setConfirmModal] = useState(false);
  const [resultModal, setResultModal] = useState(false);
  const [resultMsg, setResultMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(false);

  const coupon = getCoupon(id!);

  if (!coupon || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">쿠폰을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const canAfford = currentUser.point >= coupon.requiredPoint;
  const hasStock = coupon.stock > 0;

  const handleExchange = () => {
    const result = exchangeCoupon(coupon.id, currentUser.id);
    if (result.success) {
      updateUserPoint(currentUser.id, -coupon.requiredPoint);
      addTransaction(
        currentUser.id,
        -coupon.requiredPoint,
        'COUPON_EXCHANGE',
        `쿠폰 교환: ${coupon.name}`
      );
      setCoinTrigger(true);
      setSuccess(true);
    } else {
      setSuccess(false);
    }
    setResultMsg(result.message);
    setConfirmModal(false);
    setResultModal(true);
  };

  return (
    <div className="page-container">
      <Header title="🎁 쿠폰 상세" showBack />
      <CoinAnimation trigger={coinTrigger} onComplete={() => setCoinTrigger(false)} />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 쿠폰 비주얼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`bg-gradient-to-br ${coupon.bgColor} rounded-3xl p-8 text-white shadow-xl text-center relative overflow-hidden`}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full" />
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-8xl mb-4"
          >
            {coupon.emoji}
          </motion.div>
          <h2 className="font-black text-2xl leading-tight">{coupon.name}</h2>
          <div className="mt-4 bg-white/20 rounded-2xl py-2 px-4 inline-flex items-center gap-2">
            <Star size={16} className="fill-white text-white" />
            <span className="font-black text-xl">{formatPoint(coupon.requiredPoint)}P</span>
          </div>
        </motion.div>

        {/* 상세 정보 */}
        <div className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1">📋 쿠폰 설명</p>
            <p className="text-gray-700 text-sm leading-relaxed">{coupon.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-amber-600 font-semibold mb-1">필요 포인트</p>
              <p className="text-amber-700 font-black text-base">{formatPoint(coupon.requiredPoint)}P</p>
            </div>
            <div className="bg-blue-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-blue-600 font-semibold mb-1">카테고리</p>
              <p className="text-blue-700 font-bold text-sm">{coupon.category}</p>
            </div>
            <div className={`rounded-2xl p-3 text-center ${hasStock ? 'bg-green-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-semibold mb-1 ${hasStock ? 'text-green-600' : 'text-red-500'}`}>
                재고
              </p>
              <p className={`font-black text-base flex items-center justify-center gap-1 ${hasStock ? 'text-green-700' : 'text-red-600'}`}>
                <Package size={12} />
                {coupon.stock}
              </p>
            </div>
          </div>

          {/* 내 포인트 */}
          <div className="bg-gray-50 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">내 포인트</p>
              <p className="font-black text-gray-800">⭐ {formatPoint(currentUser.point)}P</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">교환 후</p>
              <p className={`font-black ${canAfford ? 'text-gray-700' : 'text-red-500'}`}>
                {formatPoint(Math.max(0, currentUser.point - coupon.requiredPoint))}P
              </p>
            </div>
          </div>

          {!canAfford && (
            <div className="bg-red-50 rounded-2xl p-3 text-center">
              <p className="text-red-500 text-sm font-semibold">
                ⚠️ 포인트가 {formatPoint(coupon.requiredPoint - currentUser.point)}P 부족합니다
              </p>
            </div>
          )}
        </div>

        <Button
          fullWidth
          size="lg"
          variant={canAfford && hasStock ? 'amber' : 'secondary'}
          disabled={!canAfford || !hasStock}
          onClick={() => setConfirmModal(true)}
          className="rounded-3xl"
        >
          {!hasStock ? '품절' : !canAfford ? '포인트 부족' : '🎁 쿠폰 교환하기'}
        </Button>
      </div>

      {/* 교환 확인 모달 */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="🎁 쿠폰 교환">
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-3">{coupon.emoji}</div>
            <p className="font-bold text-gray-800">{coupon.name}</p>
            <p className="text-amber-500 font-black text-xl mt-1">{formatPoint(coupon.requiredPoint)}P 차감</p>
          </div>
          <p className="text-gray-500 text-sm text-center">
            교환 후 포인트: {formatPoint(currentUser.point - coupon.requiredPoint)}P
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirmModal(false)}>취소</Button>
            <Button variant="amber" onClick={handleExchange}>교환하기</Button>
          </div>
        </div>
      </Modal>

      {/* 결과 모달 */}
      <Modal isOpen={resultModal} onClose={() => { setResultModal(false); if (success) navigate('/shop'); }} title={success ? '🎉 교환 완료!' : '❌ 교환 실패'}>
        <div className="space-y-4 text-center">
          <div className="text-5xl">{success ? '🎊' : '😢'}</div>
          <p className={`font-bold text-lg ${success ? 'text-green-600' : 'text-red-500'}`}>{resultMsg}</p>
          {success && (
            <p className="text-gray-500 text-sm">
              남은 포인트: {formatPoint(currentUser.point)}P
            </p>
          )}
          <Button fullWidth variant={success ? 'success' : 'secondary'} onClick={() => { setResultModal(false); if (success) navigate('/shop'); }}>
            확인
          </Button>
        </div>
      </Modal>
    </div>
  );
}
