import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import Header from '../components/layout/Header';
import CouponCard from '../components/shop/CouponCard';
import { useAuthStore } from '../store/authStore';
import { useShopStore } from '../store/shopStore';
import { formatPoint } from '../utils/helpers';

export default function ShopPage() {
  const { currentUser } = useAuthStore();
  const { coupons } = useShopStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('전체');

  if (!currentUser) return null;

  const categories = ['전체', ...Array.from(new Set(coupons.map((c) => c.category)))];

  const filtered = coupons
    .filter((c) => c.enabled)
    .filter((c) => activeCategory === '전체' || c.category === activeCategory)
    .filter((c) => !search || c.name.includes(search));

  const affordable = filtered.filter((c) => c.requiredPoint <= currentUser.point);
  const notAffordable = filtered.filter((c) => c.requiredPoint > currentUser.point);

  return (
    <div className="page-container">
      <Header title="🛒 포인트 상점" />

      <div className="content-area">
        {/* 포인트 현황 배너 */}
        <div className="mx-4 mt-4 bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-4 text-white shadow-md">
          <p className="text-white/80 text-xs font-semibold">내 포인트</p>
          <p className="font-black text-2xl">⭐ {formatPoint(currentUser.point)}P</p>
          <p className="text-white/70 text-xs mt-1">
            {affordable.length}개 쿠폰 교환 가능
          </p>
        </div>

        {/* 검색 */}
        <div className="mx-4 mt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="쿠폰 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-amber-400 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-5">
          {/* 교환 가능 */}
          {affordable.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700 mb-3">
                ✨ 교환 가능한 쿠폰 ({affordable.length})
              </p>
              <div className="grid grid-cols-2 gap-4">
                {affordable.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <CouponCard coupon={c} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* 포인트 부족 */}
          {notAffordable.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-400 mb-3">
                🔒 포인트 부족 ({notAffordable.length})
              </p>
              <div className="grid grid-cols-2 gap-4 opacity-60">
                {notAffordable.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.6 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <CouponCard coupon={c} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-gray-500">검색 결과가 없어요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
