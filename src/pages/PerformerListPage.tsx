import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, Target, Clock } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint } from '../utils/helpers';
import type { User } from '../types';

function PerformerCard({ performer, index }: { performer: User; index: number }) {
  const navigate = useNavigate();
  const { missions } = useMissionStore();
  const { getTransactionsForUser } = usePointStore();

  const myMissions = missions.filter((m) => m.assigneeId === performer.id);
  const success = myMissions.filter((m) => m.status === 'SUCCESS').length;
  const inProgress = myMissions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'REVIEWING').length;
  const rejected = myMissions.filter((m) => m.status === 'REJECTED').length;
  const total = myMissions.length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  const transactions = getTransactionsForUser(performer.id);
  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  const rateColor =
    successRate >= 70 ? 'text-green-600 bg-green-50' :
    successRate >= 40 ? 'text-amber-600 bg-amber-50' :
    'text-red-500 bg-red-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/performers/${performer.id}`)}
      className="bg-white rounded-3xl shadow-sm p-4 cursor-pointer border border-gray-50"
    >
      <div className="flex items-center gap-3">
        {/* 아바타 */}
        <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl flex items-center justify-center text-3xl shadow-md flex-shrink-0">
          {performer.avatar}
        </div>

        {/* 기본 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-black text-gray-800 text-base">{performer.name}</p>
            {inProgress > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-1.5 py-0.5 rounded-full">
                진행중 {inProgress}
              </span>
            )}
            {rejected > 0 && (
              <span className="text-[10px] bg-red-100 text-red-500 font-bold px-1.5 py-0.5 rounded-full">
                반려 {rejected}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-amber-600 font-bold">⭐ {formatPoint(performer.point)}P</span>
            <span className="text-xs text-gray-400">총 획득 {formatPoint(totalEarned)}P</span>
          </div>
        </div>

        {/* 성공률 + 화살표 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className={`text-center px-2.5 py-1.5 rounded-xl ${rateColor}`}>
            <p className="font-black text-lg leading-none">{successRate}%</p>
            <p className="text-[9px] font-semibold">성공률</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </div>
      </div>

      {/* 미션 현황 바 */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
          <span>미션 현황 (총 {total}개)</span>
          <span className="text-green-600 font-semibold">성공 {success}개</span>
        </div>
        {total > 0 ? (
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {success > 0 && (
              <div
                className="bg-green-400 rounded-full"
                style={{ width: `${(success / total) * 100}%` }}
              />
            )}
            {inProgress > 0 && (
              <div
                className="bg-blue-400 rounded-full"
                style={{ width: `${(inProgress / total) * 100}%` }}
              />
            )}
            {rejected > 0 && (
              <div
                className="bg-red-400 rounded-full"
                style={{ width: `${(rejected / total) * 100}%` }}
              />
            )}
            {(total - success - inProgress - rejected) > 0 && (
              <div
                className="bg-gray-200 rounded-full flex-1"
              />
            )}
          </div>
        ) : (
          <div className="h-2 bg-gray-100 rounded-full" />
        )}
        <div className="flex gap-3 mt-1.5">
          <span className="flex items-center gap-0.5 text-[9px] text-green-600"><span className="w-2 h-2 bg-green-400 rounded-full inline-block" /> 성공</span>
          <span className="flex items-center gap-0.5 text-[9px] text-blue-600"><span className="w-2 h-2 bg-blue-400 rounded-full inline-block" /> 진행중</span>
          <span className="flex items-center gap-0.5 text-[9px] text-red-500"><span className="w-2 h-2 bg-red-400 rounded-full inline-block" /> 반려</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function PerformerListPage() {
  const { users, currentUser } = useAuthStore();
  const { missions } = useMissionStore();

  if (!currentUser) return null;

  // 이 진행자가 미션을 부여한 수행자만 표시 (+ 전체 수행자)
  const assignedIds = new Set(
    missions.filter((m) => m.creatorId === currentUser.id).map((m) => m.assigneeId)
  );
  const performers = users.filter((u) => u.role === 'CHILD');

  const myPerformers = performers.filter((p) => assignedIds.has(p.id));
  const otherPerformers = performers.filter((p) => !assignedIds.has(p.id));

  // 전체 통계
  const totalMissions = missions.filter((m) => m.creatorId === currentUser.id).length;
  const successMissions = missions.filter(
    (m) => m.creatorId === currentUser.id && m.status === 'SUCCESS'
  ).length;
  const pendingReview = missions.filter(
    (m) => m.creatorId === currentUser.id && m.status === 'REVIEWING'
  ).length;

  return (
    <div className="page-container">
      <Header title="👥 수행자 관리" />

      <div className="content-area px-4 py-4 space-y-4">
        {/* 진행자 요약 통계 */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-4 text-white shadow-lg"
        >
          <p className="text-white/70 text-xs mb-3">📊 내가 관리하는 미션 현황</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="font-black text-2xl">{myPerformers.length}</p>
              <p className="text-white/80 text-[10px] mt-0.5">수행자</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="font-black text-2xl">{totalMissions}</p>
              <p className="text-white/80 text-[10px] mt-0.5">총 미션</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 text-center relative">
              {pendingReview > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-400 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingReview}
                </span>
              )}
              <p className="font-black text-2xl">{successMissions}</p>
              <p className="text-white/80 text-[10px] mt-0.5">성공 완료</p>
            </div>
          </div>
          {totalMissions > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-white/70 mb-1">
                <span>전체 성공률</span>
                <span className="font-bold">{Math.round((successMissions / totalMissions) * 100)}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${(successMissions / totalMissions) * 100}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* 미션 부여한 수행자 */}
        {myPerformers.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
              ✅ 내가 미션을 부여한 수행자 ({myPerformers.length})
            </p>
            <div className="space-y-3">
              {myPerformers.map((p, i) => (
                <PerformerCard key={p.id} performer={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* 미션 미부여 수행자 */}
        {otherPerformers.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">
              👤 전체 수행자 ({otherPerformers.length})
            </p>
            <div className="space-y-3">
              {otherPerformers.map((p, i) => (
                <PerformerCard key={p.id} performer={p} index={i} />
              ))}
            </div>
          </div>
        )}

        {performers.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">👤</p>
            <p className="text-gray-500 font-semibold">등록된 수행자가 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
