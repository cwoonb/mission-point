import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDateTime, txLabel, txColor, txSign } from '../utils/helpers';

export default function PointHistoryPage() {
  const { currentUser } = useAuthStore();
  const { getTransactionsForUser, getTodayAdCount } = usePointStore();

  if (!currentUser) return null;

  const transactions = getTransactionsForUser(currentUser.id);
  const todayEarned = transactions
    .filter((t) => {
      const today = new Date().toDateString();
      return new Date(t.createdAt).toDateString() === today && t.amount > 0;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="page-container">
      <Header title="💰 포인트 내역" showBack />

      <div className="content-area px-4 py-5 space-y-4">
        {/* 요약 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl p-3 text-white text-center shadow-md"
          >
            <p className="text-white/80 text-[10px] font-semibold">현재</p>
            <p className="font-black text-base">{formatPoint(currentUser.point)}P</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-3 text-white text-center shadow-md"
          >
            <p className="text-white/80 text-[10px] font-semibold">총 획득</p>
            <p className="font-black text-base">+{formatPoint(totalEarned)}P</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl p-3 text-white text-center shadow-md"
          >
            <p className="text-white/80 text-[10px] font-semibold">총 사용</p>
            <p className="font-black text-base">-{formatPoint(totalSpent)}P</p>
          </motion.div>
        </div>

        {/* 오늘 획득 */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-purple-700 font-bold text-sm">오늘 획득 포인트</p>
            <p className="text-xs text-purple-500 mt-0.5">
              광고 시청 {getTodayAdCount(currentUser.id)}/5회
            </p>
          </div>
          <p className="text-purple-600 font-black text-xl">+{formatPoint(todayEarned)}P</p>
        </div>

        {/* 트랜잭션 목록 */}
        <div>
          <p className="section-title">거래 내역</p>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-2">📭</p>
              <p className="text-gray-500 text-sm">포인트 내역이 없어요</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-0.5">{txLabel[tx.type]}</p>
                    <p className="text-sm text-gray-700 font-medium">{tx.description}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(tx.createdAt)}</p>
                  </div>
                  <p className={`font-black text-base ${txColor[tx.type]}`}>
                    {txSign(tx.amount)}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
