import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, XCircle } from 'lucide-react';
import Header from '../components/layout/Header';
import { StatusBadge } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import SuccessAnimation from '../components/animations/SuccessAnimation';
import { useState } from 'react';
import Modal from '../components/ui/Modal';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { usePointStore } from '../store/pointStore';
import { useShopStore } from '../store/shopStore';
import { formatPoint, formatDate, formatDateTime, statusLabel, txLabel, txColor, txSign } from '../utils/helpers';
import type { MissionStatus } from '../types';

const STATUS_GROUPS: Array<{
  statuses: MissionStatus[];
  label: string;
  color: string;
  bg: string;
}> = [
  { statuses: ['SUCCESS'], label: '성공', color: 'bg-green-400', bg: 'text-green-700 bg-green-50' },
  { statuses: ['IN_PROGRESS', 'REVIEWING', 'PENDING'], label: '진행중', color: 'bg-blue-400', bg: 'text-blue-700 bg-blue-50' },
  { statuses: ['REJECTED'], label: '반려', color: 'bg-red-400', bg: 'text-red-600 bg-red-50' },
  { statuses: ['FAILED', 'EXPIRED'], label: '실패/만료', color: 'bg-gray-300', bg: 'text-gray-500 bg-gray-50' },
];

const REJECT_REASONS = ['사진이 흐립니다.', '제출 내용이 부족합니다.', '다시 제출해주세요.', '미션 내용과 다릅니다.'];

export default function PerformerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getUser, currentUser, updateUserPoint } = useAuthStore();
  const { missions, getLatestSubmission, approveMission, rejectMission } = useMissionStore();
  const { addTransaction, getTransactionsForUser, getTodayAdCount } = usePointStore();
  const { getExchangesForUser, getCoupon } = useShopStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'points'>('overview');
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPts, setSuccessPts] = useState(0);

  const performer = getUser(id!);
  if (!performer || !currentUser) {
    return (
      <div className="page-container flex items-center justify-center">
        <p className="text-gray-500">실천자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const myMissions = missions.filter(
    (m) => m.assigneeId === performer.id && m.creatorId === currentUser.id
  );
  const allMissions = missions.filter((m) => m.assigneeId === performer.id);
  const reviewingMissions = myMissions.filter((m) => m.status === 'REVIEWING');

  const success = allMissions.filter((m) => m.status === 'SUCCESS').length;
  const total = allMissions.length;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  const transactions = getTransactionsForUser(performer.id);
  const totalEarned = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const todayAds = getTodayAdCount(performer.id);
  const totalAds = usePointStore.getState().adLogs.filter((l) => l.userId === performer.id).length;
  const exchanges = getExchangesForUser(performer.id);

  const handleApprove = (missionId: string, rewardPoint: number, assigneeId: string, creatorId: string) => {
    approveMission(missionId, currentUser.id);
    updateUserPoint(assigneeId, rewardPoint);
    addTransaction(assigneeId, rewardPoint, 'MISSION_REWARD', `미션 완료 보상`);
    const creator = getUser(creatorId);
    if (creator && creator.point >= rewardPoint) {
      updateUserPoint(creatorId, -rewardPoint);
      addTransaction(creatorId, -rewardPoint, 'MISSION_DEDUCT', `포인트 지급: ${performer.name}`);
    }
    setSuccessPts(rewardPoint);
    setShowSuccess(true);
  };

  const handleReject = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMission(rejectTarget, currentUser.id, rejectReason);
    setRejectModal(false);
    setRejectReason('');
    setRejectTarget(null);
  };

  // 미션 상태별 카운트
  const statusCounts = STATUS_GROUPS.map((g) => ({
    ...g,
    count: allMissions.filter((m) => g.statuses.includes(m.status)).length,
  }));

  // 월별 미션 성공 추이 (최근 4주)
  const weeklySuccess = Array.from({ length: 4 }, (_, i) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (3 - i) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const count = allMissions.filter((m) => {
      const d = new Date(m.createdAt);
      return d >= weekStart && d < weekEnd && m.status === 'SUCCESS';
    }).length;
    return { label: `${3 - i}주전`, count };
  });
  const maxWeekly = Math.max(...weeklySuccess.map((w) => w.count), 1);

  const TABS = [
    { key: 'overview', label: '📊 개요' },
    { key: 'missions', label: '🎯 미션' },
    { key: 'points', label: '⭐ 포인트' },
  ] as const;

  return (
    <div className="page-container">
      <Header
        title="실천자 분석"
        showBack
        showPoints={false}
        rightElement={
          <button
            onClick={() => navigate('/missions/create')}
            className="w-8 h-8 bg-purple-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md"
          >
            <Plus size={16} />
          </button>
        }
      />

      <SuccessAnimation
        isVisible={showSuccess}
        title="승인 완료!"
        description={`${performer.name}님에게 +${successPts.toLocaleString('ko-KR')}P 지급했어요! ⭐`}
        onClose={() => setShowSuccess(false)}
      />

      <div className="content-area">
        {/* 프로필 배너 */}
        <div className="bg-gradient-to-br from-pink-400 to-rose-500 px-5 pt-5 pb-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              {performer.avatar}
            </div>
            <div>
              <p className="font-black text-xl">{performer.name}</p>
              <p className="text-white/70 text-xs mt-0.5">가입 {formatDate(performer.createdAt)}</p>
            </div>
          </div>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="font-black text-xl">{formatPoint(performer.point)}</p>
              <p className="text-white/80 text-[10px]">보유 포인트</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="font-black text-xl">{successRate}%</p>
              <p className="text-white/80 text-[10px]">성공률</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-3 text-center">
              <p className="font-black text-xl">{success}/{total}</p>
              <p className="text-white/80 text-[10px]">완료/전체</p>
            </div>
          </div>
        </div>

        {/* 검토 대기 알림 */}
        {reviewingMissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4"
          >
            <p className="text-amber-700 font-bold text-sm mb-3">
              ⏳ 검토 대기 중인 미션 {reviewingMissions.length}개
            </p>
            <div className="space-y-3">
              {reviewingMissions.map((m) => {
                const sub = getLatestSubmission(m.id);
                return (
                  <div key={m.id} className="bg-white rounded-xl p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{m.title}</p>
                        {sub?.message && (
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">"{sub.message}"</p>
                        )}
                      </div>
                      <span className="text-amber-600 font-black text-sm whitespace-nowrap">+{formatPoint(m.rewardPoint)}P</span>
                    </div>
                    {sub?.imageUrl && (
                      <img src={sub.imageUrl} alt="제출" className="w-full h-28 object-cover rounded-lg" />
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        fullWidth
                        onClick={() => handleApprove(m.id, m.rewardPoint, m.assigneeId, m.creatorId)}
                      >
                        <CheckCircle2 size={13} /> 승인
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        fullWidth
                        onClick={() => { setRejectTarget(m.id); setRejectReason(''); setRejectModal(true); }}
                      >
                        <XCircle size={13} /> 반려
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 px-4 py-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === t.key
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* ── 개요 탭 ── */}
          {activeTab === 'overview' && (
            <>
              {/* 미션 상태 분포 */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="font-bold text-gray-700 text-sm mb-3">미션 상태 분포</p>
                <div className="space-y-2.5">
                  {statusCounts.map((g) => (
                    <div key={g.label} className="flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-16 text-center flex-shrink-0 ${g.bg}`}>
                        {g.label}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full ${g.color} rounded-full transition-all duration-700`}
                          style={{ width: total > 0 ? `${(g.count / total) * 100}%` : '0%' }}
                        />
                      </div>
                      <span className="text-xs font-bold text-gray-600 w-6 text-right">{g.count}</span>
                    </div>
                  ))}
                </div>
                {total === 0 && (
                  <p className="text-gray-400 text-xs text-center py-2">아직 미션이 없어요</p>
                )}
              </div>

              {/* 주간 성공 추이 */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <p className="font-bold text-gray-700 text-sm mb-4">📈 주간 미션 성공 추이</p>
                <div className="flex items-end gap-2 h-24">
                  {weeklySuccess.map((w, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-purple-600">{w.count > 0 ? w.count : ''}</span>
                      <div className="w-full bg-gray-100 rounded-lg overflow-hidden flex flex-col justify-end" style={{ height: '64px' }}>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(w.count / maxWeekly) * 100}%` }}
                          transition={{ delay: i * 0.1, duration: 0.6 }}
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-300 rounded-lg"
                        />
                      </div>
                      <span className="text-[9px] text-gray-400">{w.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 활동 요약 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <p className="text-2xl mb-1">📺</p>
                  <p className="font-black text-xl text-gray-800">{totalAds}</p>
                  <p className="text-xs text-gray-500">총 광고 시청</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">오늘 {todayAds}/5회</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm p-4 text-center">
                  <p className="text-2xl mb-1">🎁</p>
                  <p className="font-black text-xl text-gray-800">{exchanges.length}</p>
                  <p className="text-xs text-gray-500">쿠폰 교환 횟수</p>
                  <p className="text-[10px] text-orange-500 mt-0.5">총 {formatPoint(totalSpent)}P 사용</p>
                </div>
              </div>

              {/* 포인트 요약 */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl shadow-sm p-4 text-white">
                <p className="text-white/80 text-xs mb-3">⭐ 포인트 요약</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-black text-lg">{formatPoint(performer.point)}</p>
                    <p className="text-white/70 text-[10px]">현재</p>
                  </div>
                  <div>
                    <p className="font-black text-lg text-white">+{formatPoint(totalEarned)}</p>
                    <p className="text-white/70 text-[10px]">총 획득</p>
                  </div>
                  <div>
                    <p className="font-black text-lg">-{formatPoint(totalSpent)}</p>
                    <p className="text-white/70 text-[10px]">총 사용</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── 미션 탭 ── */}
          {activeTab === 'missions' && (
            <div className="space-y-3">
              {allMissions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-gray-500 text-sm">아직 미션이 없어요</p>
                  <button
                    onClick={() => navigate('/missions/create')}
                    className="mt-3 btn-primary text-sm py-2 px-4 rounded-xl inline-flex items-center gap-1"
                  >
                    <Plus size={14} /> 미션 만들기
                  </button>
                </div>
              ) : (
                [...allMissions]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((m, i) => {
                    const sub = getLatestSubmission(m.id);
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer"
                        onClick={() => navigate(`/missions/${m.id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <StatusBadge status={m.status} />
                            </div>
                            <p className="font-bold text-gray-800 text-sm truncate">{m.title}</p>
                          </div>
                          <span className="text-amber-600 font-black text-sm flex-shrink-0">
                            {formatPoint(m.rewardPoint)}P
                          </span>
                        </div>
                        {sub && (
                          <p className="text-xs text-gray-400 mt-2">
                            마지막 제출: {formatDateTime(sub.submittedAt)} ({sub.attemptNumber}회차)
                          </p>
                        )}
                      </motion.div>
                    );
                  })
              )}
            </div>
          )}

          {/* ── 포인트 탭 ── */}
          {activeTab === 'points' && (
            <div className="space-y-3">
              {/* 쿠폰 교환 내역 */}
              {exchanges.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-4">
                  <p className="font-bold text-gray-700 text-sm mb-3">🎁 쿠폰 교환 내역</p>
                  <div className="space-y-2">
                    {exchanges.slice(0, 5).map((ex) => {
                      const coupon = getCoupon(ex.couponId);
                      return (
                        <div key={ex.id} className="flex items-center gap-3">
                          <span className="text-xl">{coupon?.emoji ?? '🎁'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-700 truncate">{coupon?.name ?? '쿠폰'}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(ex.createdAt)}</p>
                          </div>
                          <span className="text-orange-500 font-bold text-sm flex-shrink-0">
                            -{formatPoint(ex.usedPoint)}P
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 포인트 거래 내역 */}
              {transactions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-gray-500 text-sm">포인트 내역이 없어요</p>
                </div>
              ) : (
                transactions.slice(0, 20).map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[10px] font-bold text-gray-400">{txLabel[tx.type]}</p>
                      <p className="text-sm text-gray-700 font-medium truncate">{tx.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDateTime(tx.createdAt)}</p>
                    </div>
                    <p className={`font-black text-base flex-shrink-0 ${txColor[tx.type]}`}>
                      {txSign(tx.amount)}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 반려 모달 */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="❌ 반려 사유">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REJECT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setRejectReason(r)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  rejectReason === r
                    ? 'bg-red-100 border-red-400 text-red-700 font-semibold'
                    : 'bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="반려 사유를 입력하세요..."
            rows={3}
            className="input-field"
          />
          <Button fullWidth variant="danger" onClick={handleReject} disabled={!rejectReason.trim()}>
            반려하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
