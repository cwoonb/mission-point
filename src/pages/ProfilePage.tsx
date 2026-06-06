import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, ChevronRight, Trophy, Target, Star, Gift } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useShopStore } from '../store/shopStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDate, roleLabel } from '../utils/helpers';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthStore();
  const { missions } = useMissionStore();
  const { getExchangesForUser } = useShopStore();
  const { getTransactionsForUser, getTodayAdCount } = usePointStore();

  if (!currentUser) return null;

  const myMissions = missions.filter(
    (m) => m.assigneeId === currentUser.id || m.creatorId === currentUser.id
  );
  const successMissions = myMissions.filter((m) => m.status === 'SUCCESS');
  const assignedMissions = missions.filter((m) => m.assigneeId === currentUser.id);
  const successRate =
    assignedMissions.length > 0
      ? Math.round((successMissions.filter((m) => m.assigneeId === currentUser.id).length / assignedMissions.length) * 100)
      : 0;

  const exchanges = getExchangesForUser(currentUser.id);
  const transactions = getTransactionsForUser(currentUser.id);
  const todayAdCount = getTodayAdCount(currentUser.id);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const menuItems = [
    { icon: Star, label: '포인트 내역', sub: `${transactions.length}건`, to: '/points', color: 'text-amber-500' },
    { icon: Gift, label: '쿠폰 교환 내역', sub: `${exchanges.length}건`, to: null, color: 'text-purple-500' },
    { icon: Target, label: '미션 히스토리', sub: `총 ${myMissions.length}개`, to: '/missions', color: 'text-blue-500' },
  ];

  return (
    <div className="page-container">
      <Header title="👤 내 정보" showBack={false} showPoints={false} />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 프로필 카드 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-5xl shadow-lg">
              {currentUser.avatar}
            </div>
            <div>
              <div className="text-white/70 text-xs mb-0.5">{roleLabel[currentUser.role]}</div>
              <h2 className="font-black text-2xl">{currentUser.name}</h2>
              <div className="mt-1 bg-white/20 rounded-xl px-3 py-1 inline-flex items-center gap-1">
                <span className="text-sm">⭐</span>
                <span className="font-black">{formatPoint(currentUser.point)}P</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-white/60 text-xs">
            가입: {formatDate(currentUser.createdAt)}
          </div>
        </motion.div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Trophy size={22} className="text-amber-400 mx-auto mb-1" />
            <p className="font-black text-2xl text-gray-800">
              {successMissions.filter((m) => m.assigneeId === currentUser.id).length}
            </p>
            <p className="text-xs text-gray-500">완료한 미션</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Target size={22} className="text-blue-400 mx-auto mb-1" />
            <p className="font-black text-2xl text-gray-800">{successRate}%</p>
            <p className="text-xs text-gray-500">미션 성공률</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.11 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <span className="text-xl block mb-1">📺</span>
            <p className="font-black text-2xl text-gray-800">{todayAdCount}</p>
            <p className="text-xs text-gray-500">오늘 광고 시청</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.14 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <Gift size={22} className="text-pink-400 mx-auto mb-1" />
            <p className="font-black text-2xl text-gray-800">{exchanges.length}</p>
            <p className="text-xs text-gray-500">교환한 쿠폰</p>
          </motion.div>
        </div>

        {/* 메뉴 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => item.to && navigate(item.to)}
              className={`w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors ${
                i < menuItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <item.icon size={20} className={item.color} />
              <div className="flex-1 text-left">
                <p className="text-gray-800 font-semibold text-sm">{item.label}</p>
                <p className="text-gray-400 text-xs">{item.sub}</p>
              </div>
              <ChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </motion.div>

        {/* 최근 교환 내역 */}
        {exchanges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-sm p-5"
          >
            <p className="section-title">🎁 최근 쿠폰 교환</p>
            <div className="space-y-2">
              {exchanges.slice(0, 3).map((ex) => {
                const coupon = useShopStore.getState().getCoupon(ex.couponId);
                return (
                  <div key={ex.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{coupon?.emoji ?? '🎁'}</span>
                      <p className="text-sm text-gray-700 font-medium">{coupon?.name ?? '알 수 없음'}</p>
                    </div>
                    <p className="text-orange-500 font-bold text-sm">-{formatPoint(ex.usedPoint)}P</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 로그아웃 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-500 font-bold active:scale-98 transition-all"
        >
          <LogOut size={18} />
          로그아웃
        </motion.button>

        <p className="text-center text-xs text-gray-300 pb-2">
          Mission Point v0.1.0 · MVP 데모
        </p>
      </div>
    </div>
  );
}
