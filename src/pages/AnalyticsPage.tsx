import { useState } from 'react';
import { BarChart3, Check, Clipboard, Download, Lightbulb, TrendingDown, TrendingUp, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { buildLeaderSnapshot } from '../utils/leaderAnalytics';
import {
  filterMissionsByAnalyticsPeriod,
  getAnalyticsPeriodLabel,
  useAnalyticsPeriodStore,
} from '../store/analyticsPeriodStore';

export default function AnalyticsPage({ embedded = false }: { embedded?: boolean }) {
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  const [copied, setCopied] = useState(false);
  const { selectedPeriod, customStart, customEnd } = useAnalyticsPeriodStore();

  if (!currentUser) return null;
  const periodMissions = filterMissionsByAnalyticsPeriod(missions, selectedPeriod, customStart, customEnd);
  const periodLabel = getAnalyticsPeriodLabel(selectedPeriod);
  const snapshot = buildLeaderSnapshot(users, periodMissions, groups, currentUser.id, periodLabel, missions);
  const topStudents = [...snapshot.students].sort((a, b) => b.weeklyRate - a.weeklyRate).slice(0, 5);
  const attentionStudents = [...snapshot.students].sort((a, b) => b.missed - a.missed).slice(0, 5);

  const report = [
    `${periodLabel} 전체 평균 수행률은 ${snapshot.weeklyRate}%입니다.`,
    `완료 미션 ${snapshot.completedMissionCount}개, 미제출 ${snapshot.missedCount}건, 검토대기 ${snapshot.pendingReviewCount}건입니다.`,
    ...snapshot.insights,
  ].join('\n');

  const copyReport = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const downloadCsv = () => {
    const rows = [
      ['학생', '반', '주간수행률', '연속일', '미제출', '검토대기'],
      ...snapshot.students.map((row) => [row.user.name, row.className, row.weeklyRate, row.streak, row.missed, row.pending]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mission-point-weekly-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={embedded ? '' : 'page-container bg-slate-50'}>
      {!embedded && <Header title="분석" showBack={false} showPoints={false} />}
      <main className={embedded ? 'space-y-4 px-4 pb-4' : 'content-area space-y-4 px-4 py-4'}>
        <section className="grid grid-cols-4 gap-2">
          {[
            ['학생', snapshot.totalStudents, 'bg-purple-50 text-purple-700'],
            ['반', snapshot.classes.length, 'bg-sky-50 text-sky-700'],
            ['평균', `${snapshot.weeklyRate}%`, 'bg-emerald-50 text-emerald-700'],
            ['관심', snapshot.attentionCount, 'bg-red-50 text-red-700'],
          ].map(([label, value, color]) => (
            <div key={label as string} className={`rounded-2xl p-3 text-center ${color as string}`}>
              <p className="text-xl font-black">{value as string | number}</p>
              <p className="text-[10px] font-bold opacity-70">{label as string}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800"><Users size={17} className="text-purple-600" /> 반별 수행률</h2>
          <div className="space-y-3">
            {snapshot.classes.map((row) => (
              <div key={row.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-black text-slate-700">{row.emoji} {row.name} <small className="font-bold text-slate-400">{row.studentCount}명</small></span>
                  <span className={`font-black ${row.weeklyRate >= 70 ? 'text-emerald-600' : row.weeklyRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{row.weeklyRate}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400" style={{ width: `${row.weeklyRate}%` }} />
                </div>
                <p className="mt-1 text-[10px] text-slate-400">미제출 {row.missed} · 검토 {row.pending} · 관심학생 {row.attention}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-black text-slate-800"><BarChart3 size={17} className="text-indigo-600" /> 카테고리별 수행률</h2>
          <div className="grid grid-cols-5 gap-2">
            {snapshot.categories.map((row) => (
              <div key={row.type} className="text-center">
                <div className="mx-auto flex h-20 w-8 items-end overflow-hidden rounded-lg bg-slate-100">
                  <div className={`w-full rounded-lg ${row.rate >= 70 ? 'bg-emerald-400' : row.rate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ height: `${Math.max(row.rate, 6)}%` }} />
                </div>
                <p className="mt-1 text-[9px] font-bold text-slate-500">{row.label}</p>
                <p className="text-xs font-black text-slate-800">{row.rate}%</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black text-emerald-700"><TrendingUp size={15} /> 우수 학생 TOP 5</h2>
            {topStudents.map((row, index) => (
              <div key={row.user.id} className="flex items-center gap-2 border-b border-slate-50 py-2 last:border-0">
                <span className="text-[10px] font-black text-slate-300">{index + 1}</span>
                <span className="text-lg">{row.user.avatar}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-black text-slate-700">{row.user.name}</span>
                <span className="text-[10px] font-black text-emerald-600">{row.weeklyRate}%</span>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-xs font-black text-red-700"><TrendingDown size={15} /> 미제출 TOP 5</h2>
            {attentionStudents.map((row, index) => (
              <div key={row.user.id} className="flex items-center gap-2 border-b border-slate-50 py-2 last:border-0">
                <span className="text-[10px] font-black text-slate-300">{index + 1}</span>
                <span className="text-lg">{row.user.avatar}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-black text-slate-700">{row.user.name}</span>
                <span className="text-[10px] font-black text-red-600">{row.missed}건</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-purple-800"><Lightbulb size={17} /> 자동 관리 인사이트</h2>
          <div className="space-y-2">
            {snapshot.insights.map((insight) => (
              <p key={insight} className="rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold leading-relaxed text-slate-600">• {insight}</p>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-900 p-4 text-white">
          <p className="text-xs font-black text-white/50">주간 보고용 요약</p>
          <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-relaxed text-white/85">{report}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={copyReport} className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 py-2.5 text-xs font-black">
              {copied ? <Check size={14} /> : <Clipboard size={14} />} {copied ? '복사됨' : '보고서 복사'}
            </button>
            <button onClick={downloadCsv} className="flex items-center justify-center gap-1.5 rounded-xl bg-purple-500 py-2.5 text-xs font-black">
              <Download size={14} /> CSV 다운로드
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
