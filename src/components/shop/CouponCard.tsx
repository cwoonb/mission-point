import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Coupon } from '../../types';
import { formatPoint } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';

interface CouponCardProps {
  coupon: Coupon;
}

export default function CouponCard({ coupon }: CouponCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const canAfford = (currentUser?.point ?? 0) >= coupon.requiredPoint;

  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/shop/${coupon.id}`)}
      className="cursor-pointer"
    >
      <div
        className={`bg-gradient-to-br ${coupon.bgColor} rounded-2xl p-4 text-white shadow-md relative overflow-hidden mb-1`}
      >
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <div className="text-3xl mb-2">{coupon.emoji}</div>
        {coupon.stock === 0 && (
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1 rounded-full">
              품절
            </span>
          </div>
        )}
      </div>
      <div className="px-1">
        <p className="text-xs font-semibold text-gray-500 mb-0.5">{coupon.category}</p>
        <p className="text-sm font-bold text-gray-800 leading-tight mb-1">{coupon.name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            <span
              className={`text-sm font-bold ${canAfford ? 'text-amber-600' : 'text-gray-400'}`}
            >
              {formatPoint(coupon.requiredPoint)}P
            </span>
          </div>
          <span className="text-xs text-gray-400">재고 {coupon.stock}</span>
        </div>
      </div>
    </motion.div>
  );
}
