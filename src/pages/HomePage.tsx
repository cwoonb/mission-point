import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Play } from 'lucide-react';
import Header from '../components/layout/Header';
import MissionCard from '../components/mission/MissionCard';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import CoinAnimation from '../components/animations/CoinAnimation';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { formatPoint } from '../utils/helpers';

const AD_TOTAL_SECONDS = 5;
const MAX_ADS = 5;

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, viewMode, updateUserPoint } = useAuthStore();
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
  const reviewingMissions = missions.filter((m) => m.status === 'REVIEWING');

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
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
              {currentUser.avatar}
            </div>
            <div>
              <p className="text-white/70 text-sm">
                {isFacilitator ? '👔 진행자 모드' : '🧒 수행자 모드'}
              </p>
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

        {/* 통계 행 */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-3 shadow-sm text-center"
          >
            <p className="text-2xl font-black text-blue-500">{activeMissions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">진행중</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-3 shadow-sm text-center"
          >
            <p className="text-2xl font-black text-green-500">{successMissions.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">완료</p>
          </motion.div>
          {isFacilitator ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-3 shadow-sm text-center cursor-pointer"
              onClick={() => navigate('/approvals')}
            >
              <p className="text-2xl font-black text-amber-500">{reviewingMissions.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">검토대기</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-3 shadow-sm text-center"
            >
              <p className="text-2xl font-black text-purple-500">
                {todayAdCount}/{MAX_ADS}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">광고시청</p>
            </motion.div>
          )}
        </div>

        {/* 광고 보상 카드 (수행자 모드) */}
        {!isFacilitator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-3xl p-5 shadow-md"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">📺</div>
              <div>
                <p className="text-white font-black text-base">광고 보고 포인트 받기</p>
                <p className="text-white/80 text-xs">
                  +10P · 오늘 {todayAdCount}/{MAX_ADS}회 시청
                </p>
              </div>
            </div>
            <button
              onClick={openAd}
              disabled={!canWatchAd}
              className="w-full bg-white text-amber-600 font-black py-3 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} className="fill-amber-500 text-amber-500" />
              {canWatchAd ? '▶ 광고 시청하기' : '오늘 시청 완료! 내일 다시 오세요 🌙'}
            </button>
            <div className="flex gap-1 mt-2 justify-center">
              {Array.from({ length: MAX_ADS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < todayAdCount ? 'bg-white' : 'bg-white/30'}`}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* 진행자 빠른 액션 */}
        {isFacilitator && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            <button
              onClick={() => navigate('/missions/create')}
              className="bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl p-4 text-white flex flex-col gap-2 shadow-md active:scale-95 transition-all"
            >
              <Plus size={24} />
              <div>
                <p className="font-bold text-sm">새 미션 만들기</p>
                <p className="text-white/70 text-xs">수행자에게 미션 부여</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/approvals')}
              className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-white flex flex-col gap-2 shadow-md active:scale-95 transition-all relative"
            >
              {reviewingMissions.length > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {reviewingMissions.length}
                </span>
              )}
              <span className="text-2xl">📋</span>
              <div>
                <p className="font-bold text-sm">승인 관리</p>
                <p className="text-white/70 text-xs">제출된 미션 검토</p>
              </div>
            </button>
          </motion.div>
        )}

        {/* 진행 중인 미션 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title mb-0">
              {isFacilitator ? '📋 최근 미션' : '🎯 내 미션'}
            </h2>
            <button
              onClick={() => navigate('/missions')}
              className="text-purple-500 text-xs font-semibold flex items-center gap-0.5"
            >
              전체보기 <ChevronRight size={12} />
            </button>
          </div>

          {activeMissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2">🌟</p>
              <p className="text-gray-500 text-sm">
                {isFacilitator
                  ? '아직 생성된 미션이 없어요.\n새 미션을 만들어보세요!'
                  : '진행 중인 미션이 없어요.\n미션을 확인해보세요!'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {activeMissions.slice(0, 3).map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <MissionCard
                    mission={m}
                    showAssignee={isFacilitator}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 성공 포인트 메시지 */}
        <AnimatePresence>
          {rewardMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              onAnimationComplete={() => setTimeout(() => setRewardMsg(''), 2000)}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-amber-400 text-white font-black px-6 py-3 rounded-2xl shadow-lg z-50 flex items-center gap-2"
            >
              <span className="text-xl">⭐</span>
              {rewardMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 광고 모달 */}
      <Modal isOpen={adModal} onClose={() => setAdModal(false)} title="📺 광고 시청" hideClose={!adDone}>
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl aspect-video flex flex-col items-center justify-center gap-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-100" />
            <span className="text-6xl z-10">📺</span>
            <p className="text-gray-600 font-bold z-10">광고 영상</p>
            <p className="text-gray-400 text-sm z-10">
              {adDone ? '시청 완료!' : `${adCountdown}초 후 완료`}
            </p>
            {!adDone && (
              <div className="absolute bottom-0 left-0 h-1.5 bg-purple-500 transition-all duration-1000"
                style={{ width: `${((AD_TOTAL_SECONDS - adCountdown) / AD_TOTAL_SECONDS) * 100}%` }}
              />
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
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all ${i < AD_TOTAL_SECONDS - adCountdown ? 'bg-purple-500' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAdReward}
            disabled={!adDone}
            fullWidth
            variant="amber"
            size="lg"
          >
            {adDone ? '⭐ +10P 받기' : `${adCountdown}초 기다리는 중...`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
