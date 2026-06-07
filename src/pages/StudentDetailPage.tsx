import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, TrendingUp, AlertTriangle, CheckCircle2, Flame, BarChart3, FileText, MessageSquarePlus, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { formatPoint, formatDate } from '../utils/helpers';
import {
  getCompletionRate, getWeeklyRate, getStreak, getUnsubmittedCount,
  getStudentStatus, statusConfig, missionTypeLabel, getWeekRateByOffset, defaultStatusThresholds,
} from '../utils/studentStats';
import type { MissionType } from '../types';

function RateBar({ value, color = 'bg-purple-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
        className={`h-2 rounded-full ${color}`} />
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { users, currentUser, teacherNotes, addTeacherNote, deleteTeacherNote } = useAuthStore();
  const { missions, approveMission, rejectMission } = useMissionStore();
  const [noteInput, setNoteInput] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const student = users.find((u) => u.id === id);
  if (!student) return (
    <div className="page-container">
      <Header title="학생 정보" showBack />
      <div className="content-area flex items-center justify-center">
        <p className="text-gray-400">학생을 찾을 수 없어요.</p>
      </div>
    </div>
  );

  const myMissions = missions.filter((m) => m.assigneeId === student.id);
  const successMissions = myMissions.filter((m) => m.status === 'SUCCESS');
  const activeMissions = myMissions.filter((m) => m.status === 'IN_PROGRESS' || m.status === 'REVIEWING');
  const overallRate = getCompletionRate(missions, student.id);
  const weekRate = getWeeklyRate(missions, student.id);
  const streak = getStreak(missions, student.id);
  const unsubmitted = getUnsubmittedCount(missions, student.id);
  const thresholds = currentUser?.statusThresholds ?? defaultStatusThresholds;
  const status = getStudentStatus(missions, student.id, thresholds);
  const sc = statusConfig[status];

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

  const bestType = typeSorted[0];
  const worstType = typeSorted[typeSorted.length - 1];

  // 4주 추이
  const weekTrend = [3, 2, 1, 0].map((offset) => ({
    label: offset === 0 ? '이번 주' : offset === 1 ? '저번 주' : `${offset}주 전`,
    rate: getWeekRateByOffset(missions, student.id, offset),
  }));

  // 검토 대기 미션
  const reviewingMissions = myMissions.filter((m) => m.status === 'REVIEWING');

  // 상담 메모
  const myNotes = teacherNotes[student.id] ?? [];

  // AI 리포트 생성 (더미)
  const aiReport = generateAIReport(student.name, weekRate, overallRate, unsubmitted, bestType?.type, worstType?.type, streak);

  return (
    <div className="page-container">
      <Header title="학생 성장 리포트" showBack showPoints={false} />

      <div className="content-area px-4 py-5 space-y-4">

        {/* 학생 프로필 카드 */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-5 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center text-4xl flex-shrink-0">
              {student.profileImage ? <img src={student.profileImage} alt="" className="w-full h-full object-cover" /> : student.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black text-xl">{student.name}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
              </div>
              <p className="text-white/60 text-xs">가입: {formatDate(student.createdAt)}</p>
              <div className="bg-white/20 rounded-xl px-3 py-1 inline-flex items-center gap-1 mt-1">
                <span className="text-sm">⭐</span>
                <span className="font-black text-sm">{formatPoint(student.point)}P</span>
              </div>
            </div>
          </div>

          {/* 핵심 지표 */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '완료', value: successMissions.length, unit: '개' },
              { label: '전체수행률', value: `${overallRate}`, unit: '%' },
              { label: '연속수행', value: streak, unit: '일' },
              { label: '미제출', value: unsubmitted, unit: '건', warn: unsubmitted > 0 },
            ].map((s) => (
              <div key={s.label} className={`bg-white/10 rounded-2xl p-2.5 text-center ${s.warn ? 'bg-red-500/20' : ''}`}>
                <p className={`font-black text-lg ${s.warn ? 'text-red-300' : ''}`}>{s.value}<span className="text-xs font-normal">{s.unit}</span></p>
                <p className="text-white/60 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 수행률 현황 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="bg-white rounded-3xl shadow-sm p-5 space-y-4">
          <p className="text-sm font-black text-gray-700 flex items-center gap-2"><BarChart3 size={16} className="text-purple-500" /> 수행률 현황</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">이번 주 수행률</span>
                <span className={`text-xs font-bold ${weekRate >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>{weekRate}%</span>
              </div>
              <RateBar value={weekRate} color={weekRate >= 70 ? 'bg-emerald-500' : 'bg-amber-500'} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs text-gray-500">전체 수행률</span>
                <span className="text-xs font-bold text-purple-600">{overallRate}%</span>
              </div>
              <RateBar value={overallRate} />
            </div>
          </div>

          {/* 미션 상태 요약 */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { label: '진행 중', value: activeMissions.length, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: '완료', value: successMissions.length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: '미제출', value: unsubmitted, color: unsubmitted > 0 ? 'text-red-600' : 'text-gray-400', bg: unsubmitted > 0 ? 'bg-red-50' : 'bg-gray-50' },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                <p className={`font-black text-xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 미션 유형별 수행률 */}
        {typeSorted.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="bg-white rounded-3xl shadow-sm p-5">
            <p className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-500" /> 미션 유형별 수행률
            </p>
            <div className="space-y-3">
              {typeSorted.map((t) => (
                <div key={t.type}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600 font-semibold">{missionTypeLabel[t.type] ?? t.type}</span>
                    <span className="text-xs text-gray-500">{t.success}/{t.total} · {t.rate}%</span>
                  </div>
                  <RateBar value={t.rate} color={t.rate >= 70 ? 'bg-emerald-500' : t.rate >= 40 ? 'bg-amber-500' : 'bg-red-400'} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {bestType && (
                <div className="bg-emerald-50 rounded-2xl p-3">
                  <p className="text-[10px] text-emerald-600 font-bold mb-0.5">가장 잘하는 유형</p>
                  <p className="text-sm font-black text-emerald-700">✨ {missionTypeLabel[bestType.type] ?? bestType.type}</p>
                  <p className="text-xs text-emerald-600">{bestType.rate}% 수행률</p>
                </div>
              )}
              {worstType && worstType.type !== bestType?.type && (
                <div className="bg-red-50 rounded-2xl p-3">
                  <p className="text-[10px] text-red-600 font-bold mb-0.5">집중 관리 필요</p>
                  <p className="text-sm font-black text-red-700">⚠️ {missionTypeLabel[worstType.type] ?? worstType.type}</p>
                  <p className="text-xs text-red-600">{worstType.rate}% 수행률</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 4주 수행 추이 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
            <Flame size={16} className="text-orange-500" /> 최근 4주 수행 추이
          </p>
          <div className="flex items-end gap-2 h-24">
            {weekTrend.map(({ label, rate }, i) => {
              const hasData = rate >= 0;
              const barH = hasData ? Math.max(rate, 4) : 4;
              const color = !hasData ? 'bg-gray-100' : rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-400' : 'bg-red-400';
              return (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  {hasData && (
                    <span className={`text-[10px] font-black ${rate >= 70 ? 'text-emerald-600' : rate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {rate}%
                    </span>
                  )}
                  <div className="w-full flex items-end" style={{ height: '72px' }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(barH / 100) * 72}px` }}
                      transition={{ duration: 0.6, delay: i * 0.08 }}
                      className={`w-full rounded-t-xl ${color} ${i === 3 ? 'ring-2 ring-offset-1 ring-purple-300' : ''}`}
                    />
                  </div>
                  <span className={`text-[10px] text-center leading-tight ${i === 3 ? 'font-black text-purple-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
          {weekTrend.every((w) => w.rate < 0) && (
            <p className="text-xs text-gray-400 text-center mt-2">아직 미션 데이터가 없어요</p>
          )}
        </motion.div>

        {/* 검토 대기 미션 */}
        {reviewingMissions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="bg-white rounded-3xl shadow-sm p-5">
            <p className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              검토 대기 {reviewingMissions.length}건
            </p>
            <div className="space-y-3">
              {reviewingMissions.map((m) => (
                <div key={m.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">{m.title}</p>
                      <p className="text-[11px] text-gray-400">{missionTypeLabel[m.missionType ?? 'OTHER']} · {m.rewardPoint}P</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { if (currentUser) approveMission(m.id, currentUser.id); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-transform">
                      <ThumbsUp size={12} /> 승인
                    </button>
                    <div className="flex-1 space-y-1">
                      <input
                        value={rejectReason[m.id] ?? ''}
                        onChange={(e) => setRejectReason((prev) => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="반려 사유 (선택)"
                        className="w-full text-[11px] bg-white border border-gray-200 rounded-xl px-2 py-1.5 outline-none"
                      />
                      <button
                        onClick={() => { if (currentUser) { rejectMission(m.id, currentUser.id, rejectReason[m.id] ?? '사유 없음'); setRejectReason((prev) => ({ ...prev, [m.id]: '' })); } }}
                        className="w-full flex items-center justify-center gap-1 py-1.5 bg-red-100 text-red-600 rounded-xl text-xs font-bold active:scale-95 transition-transform">
                        <ThumbsDown size={11} /> 반려
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 상담 메모 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="bg-white rounded-3xl shadow-sm p-5">
          <p className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
            <MessageSquarePlus size={16} className="text-purple-500" /> 상담 메모
            {myNotes.length > 0 && <span className="text-xs text-purple-500 font-semibold">{myNotes.length}개</span>}
          </p>
          <div className="flex gap-2 mb-3">
            <input
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && noteInput.trim()) { addTeacherNote(student.id, noteInput); setNoteInput(''); } }}
              placeholder="상담 내용, 특이사항 메모..."
              className="flex-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm outline-none border border-gray-100 focus:border-purple-300"
              maxLength={200}
            />
            <button
              onClick={() => { if (noteInput.trim()) { addTeacherNote(student.id, noteInput); setNoteInput(''); } }}
              disabled={!noteInput.trim()}
              className="px-4 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 active:scale-95 transition-transform">
              저장
            </button>
          </div>
          <AnimatePresence>
            {myNotes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">아직 메모가 없어요. 상담 내용을 기록해보세요.</p>
            ) : (
              <div className="space-y-2">
                {myNotes.map((note) => (
                  <motion.div key={note.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-start gap-2 bg-purple-50 rounded-xl p-3">
                    <p className="flex-1 text-sm text-gray-700 leading-relaxed">{note.text}</p>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[10px] text-gray-400">{formatDate(note.createdAt)}</p>
                      <button onClick={() => deleteTeacherNote(student.id, note.id)} className="text-gray-300 hover:text-red-400 mt-1">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* AI 리포트 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm">🤖</span>
            </div>
            <div>
              <p className="text-sm font-black text-indigo-800">AI 학습 분석 리포트</p>
              <p className="text-[10px] text-indigo-500">자동 생성 · 더미 데이터 기반</p>
            </div>
          </div>
          <p className="text-sm text-indigo-700 leading-relaxed">{aiReport}</p>
        </motion.div>

        {/* 최근 미션 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-bold text-gray-500 mb-2 px-1">최근 미션</p>
          <div className="space-y-2">
            {myMissions.slice(-5).reverse().map((m) => (
              <div key={m.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  m.status === 'SUCCESS' ? 'bg-emerald-100' :
                  m.status === 'REVIEWING' ? 'bg-amber-100' :
                  m.status === 'REJECTED' ? 'bg-red-100' : 'bg-gray-100'}`}>
                  {m.status === 'SUCCESS' ? <CheckCircle2 size={14} className="text-emerald-600" />
                    : m.status === 'REVIEWING' ? <span className="text-xs">⏳</span>
                    : m.status === 'REJECTED' ? <AlertTriangle size={14} className="text-red-500" />
                    : <span className="text-xs">📝</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{m.title}</p>
                  {m.missionType && <p className="text-[11px] text-gray-400">{missionTypeLabel[m.missionType] ?? m.missionType}</p>}
                </div>
                <span className="text-amber-600 font-bold text-xs">{m.rewardPoint}P</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 학부모 리포트 버튼 */}
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          onClick={() => navigate(`/students/${id}/report`)}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all">
          <FileText size={18} />
          학부모 리포트 생성하기
          <ChevronRight size={16} />
        </motion.button>
      </div>
    </div>
  );
}

function generateAIReport(
  name: string, weekRate: number, overallRate: number, unsubmitted: number,
  bestType?: string, worstType?: string, streak?: number
): string {
  const parts: string[] = [];

  if (weekRate >= 80) {
    parts.push(`${name} 학생은 이번 주 수행률이 ${weekRate}%로 매우 우수합니다.`);
  } else if (weekRate >= 60) {
    parts.push(`${name} 학생은 이번 주 수행률이 ${weekRate}%로 양호한 편입니다.`);
  } else {
    parts.push(`${name} 학생은 이번 주 수행률이 ${weekRate}%로, 관리가 필요한 상태입니다.`);
  }

  if (bestType && bestType !== worstType) {
    const bestLabel = missionTypeLabel[bestType] ?? bestType;
    parts.push(`특히 ${bestLabel} 미션에서 높은 수행률을 보이고 있습니다.`);
  }

  if (worstType && worstType !== bestType) {
    const worstLabel = missionTypeLabel[worstType] ?? worstType;
    parts.push(`${worstLabel} 미션은 상대적으로 지연되는 경향이 있어 별도 독려가 필요합니다.`);
  }

  if (streak && streak >= 3) {
    parts.push(`최근 ${streak}일 연속으로 미션을 수행하여 좋은 습관이 형성되고 있습니다.`);
  }

  if (unsubmitted >= 2) {
    parts.push(`현재 ${unsubmitted}건의 미제출 미션이 있어 조기 상담을 권장합니다.`);
  }

  return parts.join(' ');
}
