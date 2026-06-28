import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share2, ArrowLeft, CheckCircle2, AlertTriangle, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { formatDate } from '../utils/helpers';
import {
  getCompletionRate, getWeeklyRate, getStreak, getUnsubmittedCount,
  missionTypeLabel,
} from '../utils/studentStats';
import type { MissionType } from '../types';

export default function ParentReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser } = useAuthStore();
  const { missions } = useMissionStore();

  const student = users.find((u) => u.id === id);
  if (!student || !currentUser) return null;

  const myMissions = missions.filter((m) => m.assigneeId === student.id && m.creatorId === currentUser.id);
  const successMissions = myMissions.filter((m) => m.status === 'SUCCESS');
  const weekMissions = (() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    return myMissions.filter((m) => new Date(m.createdAt) >= weekStart);
  })();
  const weekSuccess = weekMissions.filter((m) => m.status === 'SUCCESS');
  const weekUnsubmitted = weekMissions.filter((m) => m.status === 'IN_PROGRESS' && new Date(m.endDate) < new Date());

  const weekRate = getWeeklyRate(missions, student.id);
  const overallRate = getCompletionRate(missions, student.id);
  const streak = getStreak(missions, student.id);
  const unsubmitted = getUnsubmittedCount(missions, student.id);

  // 미션 유형별 통계
  const typeStats: Record<string, { total: number; success: number }> = {};
  myMissions.forEach((m) => {
    const t = m.missionType ?? 'OTHER';
    if (!typeStats[t]) typeStats[t] = { total: 0, success: 0 };
    typeStats[t].total++;
    if (m.status === 'SUCCESS') typeStats[t].success++;
  });
  const typeSorted = Object.entries(typeStats)
    .map(([type, s]) => ({ type: type as MissionType, rate: s.total ? Math.round((s.success / s.total) * 100) : 0, ...s }))
    .sort((a, b) => b.rate - a.rate);

  const today = new Date();
  const weekStartStr = formatDate(new Date(today.getTime() - 6 * 86400000).toISOString());
  const weekEndStr = formatDate(today.toISOString());

  const handleShare = async () => {
    const text = `[주간 학습 리포트] ${student.name} 실천자\n\n이번 주 미션 수행률: ${weekRate}%\n완료 미션: ${weekSuccess.length}개\n미제출 미션: ${weekUnsubmitted.length}개\n연속 수행일: ${streak}일\n\n리더 코멘트: 꾸준히 참여하고 있어 긍정적입니다.`;
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: `${student.name} 주간 리포트`, text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('리포트가 클립보드에 복사됐어요!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-sky-100 flex justify-center">
      <div className="w-full max-w-md px-4 py-6 space-y-4">

        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="font-black text-gray-800">보호자 리포트</h1>
          <button onClick={handleShare}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-all">
            <Share2 size={14} /> 공유하기
          </button>
        </div>

        {/* 리포트 카드 */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden">

          {/* 상단 헤더 */}
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">주간 리포트</span>
              <span className="text-white/50 text-xs">{weekStartStr} ~ {weekEndStr}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center text-3xl">
                {student.profileImage ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" /> : student.avatar}
              </div>
              <div>
                <p className="font-black text-2xl">{student.name} 실천자</p>
                <p className="text-white/60 text-xs">{currentUser.name} 리더 반</p>
              </div>
            </div>
          </div>

          {/* 핵심 지표 */}
          <div className="p-5 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-500 mb-3">📊 이번 주 핵심 지표</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '미션 수행률', value: `${weekRate}%`, icon: '📈', color: weekRate >= 70 ? 'text-emerald-600' : 'text-amber-600' },
                { label: '완료 미션', value: `${weekSuccess.length}개`, icon: '✅', color: 'text-blue-600' },
                { label: '연속 수행일', value: `${streak}일`, icon: '🔥', color: 'text-orange-500' },
                { label: '미제출 미션', value: `${weekUnsubmitted.length}건`, icon: '⚠️', color: weekUnsubmitted.length > 0 ? 'text-red-600' : 'text-gray-400' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-2xl p-3">
                  <p className="text-xl mb-1">{s.icon}</p>
                  <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 유형별 수행 현황 */}
          {typeSorted.length > 0 && (
            <div className="p-5 border-b border-gray-50">
              <p className="text-xs font-bold text-gray-500 mb-3">📚 유형별 수행 현황</p>
              <div className="space-y-2">
                {typeSorted.map((t) => (
                  <div key={t.type} className="flex items-center gap-3">
                    <p className="text-xs font-semibold text-gray-600 w-16 flex-shrink-0">{missionTypeLabel[t.type] ?? t.type}</p>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full ${t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${t.rate}%` }} />
                    </div>
                    <p className="text-xs font-bold text-gray-600 w-8 text-right">{t.rate}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 칭찬할 점 */}
          <div className="p-5 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <p className="text-sm font-bold text-emerald-700">칭찬할 점</p>
            </div>
            <div className="space-y-2">
              {weekRate >= 70 && (
                <div className="flex items-start gap-2">
                  <Star size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">이번 주 미션 수행률이 {weekRate}%로 우수합니다.</p>
                </div>
              )}
              {streak >= 3 && (
                <div className="flex items-start gap-2">
                  <Star size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{streak}일 연속으로 미션을 수행하며 꾸준한 학습 습관을 기르고 있습니다.</p>
                </div>
              )}
              {typeSorted[0] && typeSorted[0].rate >= 70 && (
                <div className="flex items-start gap-2">
                  <Star size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{missionTypeLabel[typeSorted[0].type] ?? typeSorted[0].type} 미션을 꾸준히 수행했습니다.</p>
                </div>
              )}
              {weekRate < 70 && streak < 3 && (!typeSorted[0] || typeSorted[0].rate < 70) && (
                <p className="text-sm text-gray-400">이번 주는 해당 사항이 없어요.</p>
              )}
            </div>
          </div>

          {/* 관리 필요 */}
          <div className="p-5 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} className="text-amber-500" />
              <p className="text-sm font-bold text-amber-700">관리 필요</p>
            </div>
            <div className="space-y-2">
              {unsubmitted > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs mt-0.5">•</span>
                  <p className="text-sm text-gray-700">미제출 미션이 {unsubmitted}건 있어 확인이 필요합니다.</p>
                </div>
              )}
              {typeSorted.length > 1 && typeSorted[typeSorted.length - 1].rate < 60 && (
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-xs mt-0.5">•</span>
                  <p className="text-sm text-gray-700">
                    {missionTypeLabel[typeSorted[typeSorted.length - 1].type]} 미션이 지연되는 경향이 있어 별도 독려를 권장합니다.
                  </p>
                </div>
              )}
              {unsubmitted === 0 && (typeSorted.length <= 1 || typeSorted[typeSorted.length - 1].rate >= 60) && (
                <p className="text-sm text-gray-400">이번 주는 특별히 관리할 사항이 없습니다 👍</p>
              )}
            </div>
          </div>

          {/* 리더 코멘트 */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-purple-100 rounded-xl flex items-center justify-center text-sm">{currentUser.avatar}</div>
              <p className="text-sm font-bold text-gray-700">리더 코멘트</p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-4">
              <p className="text-sm text-purple-800 leading-relaxed">
                {weekRate >= 70
                  ? `꾸준히 참여하고 있어 매우 기특합니다. ${streak >= 3 ? `${streak}일 연속 수행은 정말 대단해요!` : '앞으로도 이 페이스를 유지해봐요!'}`
                  : `학습에 더 적극적으로 참여하면 좋겠습니다. 함께 목표를 정해서 차근차근 나아가봐요.`}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 하단 브랜딩 */}
        <p className="text-center text-xs text-gray-400 pb-4">Mission Point · 실천자 관리 플랫폼</p>
      </div>
    </div>
  );
}
