import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { useVillageStore } from '../store/villageStore';
import { formatPoint } from '../utils/helpers';
import { getWeeklyRate } from '../utils/studentStats';

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_H = [64, 48, 32];
const PODIUM_COLOR = ['bg-amber-400', 'bg-gray-300', 'bg-amber-700/50'];

export default function RankingPage() {
  const { users, currentUser } = useAuthStore();
  const { getMyGroups } = useGroupStore();
  const { missions } = useMissionStore();
  const { getVillage } = useVillageStore();
  const [groupFilter, setGroupFilter] = useState('all');

  if (!currentUser) return null;

  const isFacilitator = currentUser.role !== 'CHILD';
  const facilitatorId = isFacilitator ? currentUser.id : currentUser.facilitatorId;

  const allStudents = facilitatorId
    ? users.filter((u) => u.role === 'CHILD' && u.facilitatorId === facilitatorId)
    : users.filter((u) => u.role === 'CHILD');

  const myGroups = facilitatorId ? getMyGroups(facilitatorId) : [];

  const pool = groupFilter === 'all' ? allStudents : allStudents.filter((s) => s.groupId === groupFilter);
  const ranked = [...pool].sort((a, b) => b.point - a.point);

  // 이번 주 획득 포인트 (SUCCESS 미션 기준)
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);
  const weeklyEarned = (id: string) =>
    missions
      .filter((m) => m.assigneeId === id && m.status === 'SUCCESS' && new Date(m.createdAt) >= weekStart)
      .reduce((s, m) => s + m.rewardPoint, 0);

  const myRank = ranked.findIndex((s) => s.id === currentUser.id) + 1;
  const myWeekRate = getWeeklyRate(missions, currentUser.id);
  const myVillage = getVillage(currentUser.id);

  return (
    <div className="page-container">
      <Header title="🏆 포인트 랭킹" showBack={false} />

      <div className="content-area px-4 py-4 space-y-4">

        {/* 내 순위 배너 (실천자) */}
        {!isFacilitator && myRank > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-4 text-white shadow-lg">
            <p className="text-white/60 text-xs mb-2">내 현재 순위</p>
            <div className="flex items-center gap-4">
              <span className="font-black text-5xl">#{myRank}</span>
              <div className="flex-1">
                <p className="font-black text-lg">{currentUser.name}</p>
                <p className="text-white/70 text-sm">⭐ {formatPoint(currentUser.point)}P · 이번 주 {myWeekRate}%</p>
                <p className="text-white/60 text-xs mt-0.5">🏘️ {myVillage?.name ?? '마을'} · Lv.{myVillage?.level ?? 1}</p>
              </div>
              <span className="text-4xl">{myRank <= 3 ? MEDALS[myRank - 1] : '🏃'}</span>
            </div>
          </motion.div>
        )}

        {/* 그룹 필터 */}
        {myGroups.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[{ id: 'all', emoji: '👥', name: '전체' }, ...myGroups.map(g => ({ id: g.id, emoji: g.emoji, name: g.name }))].map((g) => (
              <button key={g.id} onClick={() => setGroupFilter(g.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${groupFilter === g.id ? 'bg-purple-600 text-white shadow-md' : 'bg-white text-gray-500 shadow-sm'}`}>
                <span>{g.emoji}</span>{g.name}
              </button>
            ))}
          </div>
        )}

        {/* 시상대 (Top 3) */}
        {ranked.length >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm px-4 pt-4 pb-0 overflow-hidden">
            <p className="text-xs font-bold text-gray-400 mb-4 text-center">TOP 3</p>
            <div className="flex items-end justify-center gap-2">
              {[1, 0, 2].map((rankIdx) => {
                const s = ranked[rankIdx];
                if (!s) return <div key={rankIdx} className="flex-1" />;
                const isMe = s.id === currentUser.id;
                return (
                  <div key={s.id} className="flex-1 flex flex-col items-center gap-1">
                    {rankIdx === 0 && <Crown size={18} className="text-amber-400 mb-0.5" />}
                    <div className={`relative rounded-2xl overflow-hidden flex items-center justify-center text-2xl flex-shrink-0 ${rankIdx === 0 ? 'w-14 h-14' : 'w-11 h-11'} ${isMe ? 'ring-2 ring-purple-400' : ''} bg-gray-100`}>
                      {s.profileImage ? <img src={s.profileImage} alt="" className="w-full h-full object-cover" /> : s.avatar}
                    </div>
                    <p className="text-xs font-bold text-gray-700 truncate w-full text-center px-1">{s.name}</p>
                    <p className={`text-[11px] font-black ${rankIdx === 0 ? 'text-amber-500' : 'text-gray-500'}`}>{formatPoint(s.point)}P</p>
                    <div className={`w-full ${PODIUM_COLOR[rankIdx]} flex items-start justify-center pt-1 text-xl rounded-t-xl`}
                      style={{ height: `${PODIUM_H[rankIdx]}px` }}>
                      {MEDALS[rankIdx]}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 전체 랭킹 리스트 */}
        <div className="space-y-2">
          {ranked.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-3xl shadow-sm">
              <p className="text-4xl mb-2">🏅</p>
              <p className="text-gray-500 font-semibold">아직 실천자가 없어요</p>
            </div>
          ) : ranked.map((student, i) => {
            const rank = i + 1;
            const isMe = student.id === currentUser.id;
            const weekly = weeklyEarned(student.id);
            const weekRate = getWeeklyRate(missions, student.id);
            const village = getVillage(student.id);

            return (
              <motion.div key={student.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-3 py-3 rounded-2xl border ${isMe ? 'bg-purple-50 border-purple-300 shadow-md' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className="w-8 text-center font-black text-base flex-shrink-0">
                  {rank <= 3 ? MEDALS[rank - 1] : <span className="text-gray-400 text-sm">#{rank}</span>}
                </div>
                <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-xl flex-shrink-0 ${rank <= 3 ? 'ring-2 ring-amber-300' : 'bg-gray-100'}`}>
                  {student.profileImage ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" /> : student.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className={`text-sm font-bold truncate ${isMe ? 'text-purple-700' : 'text-gray-800'}`}>{student.name}</p>
                    {isMe && <span className="text-[9px] bg-purple-100 text-purple-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">나</span>}
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">🏘️ Lv.{village?.level ?? 1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">이번 주 {weekRate}%</span>
                    {weekly > 0 && <span className="text-[10px] text-emerald-600 font-semibold">+{formatPoint(weekly)}P 획득</span>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-black text-sm ${isMe ? 'text-purple-700' : 'text-amber-600'}`}>⭐ {formatPoint(student.point)}P</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
