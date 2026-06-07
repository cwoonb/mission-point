import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Play, AlertTriangle, TrendingUp, Clock, Users, CheckCircle2 } from 'lucide-react';
import Header from '../components/layout/Header';
import MissionCard from '../components/mission/MissionCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import CoinAnimation from '../components/animations/CoinAnimation';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint, formatDateTime } from '../utils/helpers';
import {
  getStudentStatus,
  getWeeklyRate,
  getOverdueMissions,
  getUnsubmittedCount,
  statusConfig,
  defaultStatusThresholds,
} from '../utils/studentStats';

const AD_TOTAL_SECONDS = 5;
const MAX_ADS = 5;

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, viewMode, updateUserPoint, users } = useAuthStore();
  const { missions } = useMissionStore();
  const { recordAdWatch, addTransaction, getTodayAdCount } = usePointStore();

  const [adModal, setAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(AD_TOTAL_SECONDS);
  const [adDone, setAdDone] = useState(false);
  const [coinTrigger, setCoinTrigger] = useState(false);
  const [rewardMsg, setRewardMsg] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayAdCount = currentUser ? getTodayAdCount(currentUser.id) : 0;
  const canWatchAd = todayAdCount < MAX_ADS;

  const myMissions =
    viewMode === 'PERFORMER'
      ? missions.filter((m) => m.assigneeId === currentUser?.id)
      : missions.filter((m) => m.creatorId === currentUser?.id);

  const activeMissions = myMissions.filter(
    (m) => m.status === 'IN_PROGRESS' || m.status === 'REVIEWING' || m.status === 'REJECTED'
  );
  const successMissions = myMissions.filter((m) => m.status === 'SUCCESS');
  const reviewingMissions = myMissions.filter((m) => m.status === 'REVIEWING');

  // 선생님 대시보드 데이터 계산
  const thresholds = currentUser?.statusThresholds ?? defaultStatusThresholds;
  const myStudents = currentUser?.socialProvider
    ? users.filter((u) => u.role === 'CHILD' && u.facilitatorId === currentUser.id)
    : users.filter((u) => u.role === 'CHILD');

  const overdueStudents = myStudents.filter(
    (s) => getOverdueMissions(missions, s.id).length > 0
  );
  const counselingStudents = myStudents.filter(
    (s) => getStudentStatus(missions, s.id, thresholds) === 'COUNSELING'
  );
  const weeklyRate = myStudents.length > 0
    ? Math.round(myStudents.reduce((acc, s) => acc + getWeeklyRate(missions, s.id), 0) / myStudents.length)
    : 0;
  const totalUnsubmitted = myStudents.reduce(
    (acc, s) => acc + getUnsubmittedCount(missions, s.id),
    0
  );

  const recentReviewing = missions
    .filter((m) => m.status === 'REVIEWING' && m.creatorId === currentUser?.id)
    .slice(0, 3);

  const recentSuccess = missions
    .filter((m) => m.status === 'SUCCESS' && m.creatorId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const openAd = () => {
    setAdCountdown(AD_TOTAL_SECONDS);
    setAdDone(false);
    setAdModal(true);
  };

  useEffect(() => {
    if (!adModal) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    if (adDone) return;

    intervalRef.current = setInterval(() => {
      setAdCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setAdDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [adModal, adDone]);

  const handleAdReward = () => {
    if (!currentUser || !adDone) return;
    const result = recordAdWatch(currentUser.id);
    if (result.success) {
      updateUserPoint(currentUser.id, result.points);
      addTransaction(currentUser.id, result.points, 'AD_REWARD', '광고 시청 보상');
      setRewardMsg(result.message);
      setCoinTrigger(true);
    }
    setAdModal(false);
  };

  if (!currentUser) return null;

  const isFacilitator = viewMode === 'FACILITATOR';

  // ── 수행자(학생) 뷰 ───────────────────────────────
  if (!isFacilitator) {
    return (
      <div className="page-container">
        <Header />
        <CoinAnimation trigger={coinTrigger} onComplete={() => setCoinTrigger(false)} />

        <div className="content-area px-4 py-5 space-y-5">
          {/* 환영 카드 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-3xl p-5 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl flex-shrink-0">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt="프로필" className="w-full h-full object-cover" />
                ) : currentUser.avatar}
              </div>
              <div>
                <p className="text-white/70 text-sm">🧒 수행자 모드</p>
                <p className="font-black text-xl">{currentUser.name}님 안녕하세요!</p>
              </div>
            </div>
            <div className="mt-4 bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs">현재 포인트</p>
                <p className="font-black text-2xl">⭐ {formatPoint(currentUser.point)}P</p>
              </div>
              <button
                onClick={() => navigate('/points')}
                className="text-white/80 text-xs flex items-center gap-0.5 bg-white/10 px-3 py-1.5 rounded-xl"
              >
                내역 보기 <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>

          {/* 통계 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '진행중', value: activeMissions.length, color: 'text-blue-500' },
              { label: '완료', value: successMissions.length, color: 'text-green-500' },
              { label: '광고시청', value: `${todayAdCount}/${MAX_ADS}`, color: 'text-purple-500' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-3 shadow-sm text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* 광고 보상 */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📺</div>
              <div>
                <p className="text-white font-black text-base">광고 보고 포인트 받기</p>
                <p className="text-white/80 text-xs">+10P · 오늘 {todayAdCount}/{MAX_ADS}회 시청</p>
              </div>
            </div>
            <button onClick={openAd} disabled={!canWatchAd}
              className="w-full bg-white text-amber-600 font-black py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50">
              <Play size={16} className="fill-amber-500 text-amber-500" />
              {canWatchAd ? '▶ 광고 시청하기' : '오늘 시청 완료! 내일 다시 오세요 🌙'}
            </button>
            <div className="flex gap-1 mt-2 justify-center">
              {Array.from({ length: MAX_ADS }).map((_, i) => (
                <div key={i} className={`h-1.5 flex-1 rounded-full ${i < todayAdCount ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </motion.div>

          {/* 미션 목록 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-title mb-0">🎯 내 미션</h2>
              <button onClick={() => navigate('/missions')} className="text-purple-500 text-xs font-semibold flex items-center gap-0.5">
                전체보기 <ChevronRight size={12} />
              </button>
            </div>
            {activeMissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <p className="text-3xl mb-2">🌟</p>
                <p className="text-gray-500 text-sm">진행 중인 미션이 없어요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {activeMissions.slice(0, 3).map((m, i) => (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                    <MissionCard mission={m} showAssignee={false} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {rewardMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: -20 }}
              onAnimationComplete={() => setTimeout(() => setRewardMsg(''), 2000)}
              className="fixed bottom-24 left-4 right-4 max-w-xs mx-auto bg-amber-400 text-white font-black px-4 py-3 rounded-2xl shadow-lg z-50 flex items-center justify-center gap-2"
            >
              <span className="text-xl">⭐</span>{rewardMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <Modal isOpen={adModal} onClose={() => setAdModal(false)} title="📺 광고 시청" hideClose={!adDone}>
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="w-full bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 relative overflow-hidden">
              <span className="text-6xl z-10">📺</span>
              <p className="text-gray-600 font-bold z-10">광고 영상</p>
              <p className="text-gray-400 text-sm z-10">{adDone ? '시청 완료!' : `${adCountdown}초 후 완료`}</p>
              {!adDone && (
                <div className="absolute bottom-0 left-0 h-1.5 bg-purple-500 transition-all duration-1000"
                  style={{ width: `${((AD_TOTAL_SECONDS - adCountdown) / AD_TOTAL_SECONDS) * 100}%` }} />
              )}
            </div>
            {adDone ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                <p className="text-2xl mb-1">🎉</p>
                <p className="font-bold text-gray-800">광고 시청 완료!</p>
                <p className="text-amber-500 font-black text-xl mt-1">+10P 받기</p>
              </motion.div>
            ) : (
              <div className="text-center">
                <p className="text-gray-500 text-sm">광고를 시청하는 중...</p>
                <div className="flex gap-1.5 justify-center mt-2">
                  {Array.from({ length: AD_TOTAL_SECONDS }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < AD_TOTAL_SECONDS - adCountdown ? 'bg-purple-500' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
            )}
            <Button onClick={handleAdReward} disabled={!adDone} fullWidth variant="amber" size="lg">
              {adDone ? '⭐ +10P 받기' : `${adCountdown}초 기다리는 중...`}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // ── 선생님 대시보드 ───────────────────────────────
  return (
    <div className="page-container">
      <Header />
      <CoinAnimation trigger={coinTrigger} onComplete={() => setCoinTrigger(false)} />

      <div className="content-area px-4 py-5 space-y-4">

        {/* 선생님 헤더 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                {currentUser.profileImage ? (
                  <img src={currentUser.profileImage} alt="프로필" className="w-full h-full object-cover" />
                ) : currentUser.avatar}
              </div>
              <div>
                <p className="text-white/60 text-xs">선생님 대시보드</p>
                <p className="font-black text-lg">{currentUser.name} 선생님 👋</p>
              </div>
            </div>
            <div className="bg-amber-400/20 border border-amber-400/30 rounded-xl px-3 py-1.5 text-right">
              <p className="text-amber-300 text-[10px]">보유 포인트</p>
              <p className="text-amber-300 font-black text-sm">⭐ {formatPoint(currentUser.point)}P</p>
            </div>
          </div>
          <p className="text-white/50 text-xs">학생들의 미션 수행 현황을 확인하세요</p>
        </motion.div>

        {/* 오늘의 관리 요약 */}
        <div>
          <p className="text-xs font-bold text-gray-500 mb-2 px-1">오늘의 관리 요약</p>
          <div className="grid grid-cols-2 gap-3">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
              onClick={() => navigate('/performers', { state: { filter: 'unsubmitted' } })}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-95 transition-transform ${totalUnsubmitted > 0 ? 'border-orange-400' : 'border-green-400'}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={14} className={totalUnsubmitted > 0 ? 'text-orange-500' : 'text-green-500'} />
                <p className="text-xs font-bold text-gray-500">미제출 학생</p>
              </div>
              <p className={`text-2xl font-black ${totalUnsubmitted > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                {overdueStudents.length}명
              </p>
              <p className={`text-[11px] mt-0.5 ${totalUnsubmitted > 0 ? 'text-orange-400' : 'text-gray-400'}`}>
                {totalUnsubmitted > 0 ? `미제출 ${totalUnsubmitted}건 · 탭하여 확인 →` : '모두 제출했어요 ✓'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08 }}
              onClick={() => navigate('/performers')}
              className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-indigo-400 cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-indigo-500" />
                <p className="text-xs font-bold text-gray-500">이번 주 수행률</p>
              </div>
              <p className={`text-2xl font-black ${weeklyRate >= 70 ? 'text-indigo-600' : 'text-amber-600'}`}>
                {weeklyRate}%
              </p>
              <p className="text-[11px] text-indigo-400 mt-0.5">
                {weeklyRate >= 70 ? '양호 · 탭하여 보기 →' : '관리 필요 · 탭하여 보기 →'}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.11 }}
              onClick={() => navigate('/approvals')}
              className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-amber-400 cursor-pointer active:scale-95 transition-transform">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-amber-500" />
                <p className="text-xs font-bold text-gray-500">검토 대기</p>
              </div>
              <p className="text-2xl font-black text-amber-600">{reviewingMissions.length}건</p>
              <p className="text-[11px] text-amber-500 mt-0.5">탭하여 검토하기 →</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.14 }}
              onClick={() => navigate('/performers', { state: { filter: 'counseling' } })}
              className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 cursor-pointer active:scale-95 transition-transform ${counselingStudents.length > 0 ? 'border-red-400' : 'border-green-400'}`}>
              <div className="flex items-center gap-2 mb-1">
                <Users size={14} className={counselingStudents.length > 0 ? 'text-red-500' : 'text-green-500'} />
                <p className="text-xs font-bold text-gray-500">상담 필요</p>
              </div>
              <p className={`text-2xl font-black ${counselingStudents.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {counselingStudents.length}명
              </p>
              <p className={`text-[11px] mt-0.5 ${counselingStudents.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                {counselingStudents.length > 0 ? '즉시 확인 필요 · 탭하여 보기 →' : '이상 없음 ✓'}
              </p>
            </motion.div>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onClick={() => navigate('/missions/create')}
            className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md active:scale-95 transition-all">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">새 미션 만들기</p>
              <p className="text-white/70 text-[11px]">학생에게 미션 부여</p>
            </div>
          </motion.button>

          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            onClick={() => navigate('/performers')}
            className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-4 text-white flex items-center gap-3 shadow-md active:scale-95 transition-all">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm">학생 관리</p>
              <p className="text-white/70 text-[11px]">{myStudents.length}명 관리 중</p>
            </div>
          </motion.button>
        </div>

        {/* 상담 필요 학생 */}
        {counselingStudents.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-red-50 border border-red-100 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-red-500" />
              <p className="text-sm font-bold text-red-700">상담 필요 학생</p>
            </div>
            <div className="space-y-2">
              {counselingStudents.map((s) => {
                const sc = statusConfig[getStudentStatus(missions, s.id, thresholds)];
                const unsubmitted = getUnsubmittedCount(missions, s.id);
                return (
                  <button key={s.id} onClick={() => navigate(`/students/${s.id}`)}
                    className="w-full flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 active:scale-95 transition-transform">
                    <span className="text-xl">{s.avatar}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-gray-800">{s.name}</p>
                      <p className="text-xs text-red-500">미제출 {unsubmitted}건</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                    <ChevronRight size={14} className="text-gray-300" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 검토 대기 미션 */}
        {recentReviewing.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-500">검토 대기 미션</p>
              <button onClick={() => navigate('/approvals')} className="text-purple-500 text-xs font-semibold flex items-center gap-0.5">
                전체 <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentReviewing.map((m) => {
                const student = users.find((u) => u.id === m.assigneeId);
                return (
                  <div key={m.id} onClick={() => navigate('/approvals')}
                    className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3 cursor-pointer active:scale-95 transition-transform">
                    <span className="text-xl">{student?.avatar ?? '👤'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{m.title}</p>
                      <p className="text-xs text-gray-400">{student?.name} · +{formatPoint(m.rewardPoint)}P</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">검토대기</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 최근 완료 현황 */}
        {recentSuccess.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-500">최근 완료 현황</p>
            </div>
            <div className="space-y-2">
              {recentSuccess.map((m) => {
                const student = users.find((u) => u.id === m.assigneeId);
                return (
                  <div key={m.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{m.title}</p>
                      <p className="text-xs text-gray-400">{student?.name}</p>
                    </div>
                    <span className="text-green-600 font-bold text-xs">+{formatPoint(m.rewardPoint)}P</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 빈 상태 */}
        {myStudents.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-600 font-bold mb-1">아직 관리 중인 학생이 없어요</p>
            <p className="text-gray-400 text-sm mb-4">수행자 탭에서 학생을 초대해보세요</p>
            <button onClick={() => navigate('/performers')}
              className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-2xl">
              학생 초대하기 →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
