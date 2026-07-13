import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpDown, BarChart3, ChevronRight, Flame, List, Search, UserCheck, UserRoundX, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { buildLeaderSnapshot } from '../utils/leaderAnalytics';
import { statusConfig } from '../utils/studentStats';
import {
  filterMissionsByAnalyticsPeriod,
  getAnalyticsPeriodLabel,
  useAnalyticsPeriodStore,
} from '../store/analyticsPeriodStore';
import AnalyticsPage from './AnalyticsPage';

type SortKey = 'name' | 'rate-high' | 'rate-low';
type StatusFilter = 'ALL' | 'EXCELLENT' | 'CAUTION' | 'ATTENTION' | 'UNSUBMITTED';

export default function StudentsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState('all');
  const requestedStatus = searchParams.get('status');
  const [status, setStatus] = useState<StatusFilter>(
    requestedStatus === 'attention' ? 'ATTENTION' : requestedStatus === 'unsubmitted' ? 'UNSUBMITTED' : 'ALL'
  );
  const [sort, setSort] = useState<SortKey>('rate-low');
  const { selectedPeriod, customStart, customEnd } = useAnalyticsPeriodStore();
  const showAnalysis = searchParams.get('view') === 'analysis';

  if (!currentUser) return null;
  const periodMissions = filterMissionsByAnalyticsPeriod(missions, selectedPeriod, customStart, customEnd);
  const snapshot = buildLeaderSnapshot(users, periodMissions, groups, currentUser.id, getAnalyticsPeriodLabel(selectedPeriod), missions);

  const rows = (() => {
    const filtered = snapshot.students.filter((row) => {
      const classMatch = classId === 'all' || row.user.groupId === classId || (classId === 'unassigned' && !row.user.groupId);
      const statusMatch =
        status === 'ALL' ||
        row.status === status ||
        (status === 'ATTENTION' && ['COUNSELING', 'UNSUBMITTED'].includes(row.status));
      return classMatch && statusMatch && row.user.name.toLowerCase().includes(query.trim().toLowerCase());
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.user.name.localeCompare(b.user.name);
      if (sort === 'rate-high') return b.weeklyRate - a.weeklyRate;
      return a.weeklyRate - b.weeklyRate;
    });
  })();

  return (
    <div className="page-container bg-slate-50">
      <Header title="학생 관리" showBack={false} showPoints={false} />
      <div className="content-area">
        <div className="sticky top-0 z-30 border-b border-slate-100 bg-slate-50/95 px-4 py-2 backdrop-blur">
          <div className="grid grid-cols-2 rounded-2xl bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-black ${!showAnalysis ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              <List size={15} /> 학생 목록
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ view: 'analysis' })}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-black ${showAnalysis ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'}`}
            >
              <BarChart3 size={15} /> 전체 분석
            </button>
          </div>
        </div>
        {showAnalysis ? <AnalyticsPage embedded /> : <main className="space-y-4 px-4 py-4">
        <section className="grid grid-cols-5 gap-2">
          {[
            { label: '전체', value: snapshot.totalStudents, icon: Users, color: 'text-purple-600 bg-purple-50' },
            { label: '활성', value: snapshot.activeStudents, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
            { label: '미제출', value: snapshot.missedCount, icon: UserRoundX, color: 'text-red-600 bg-red-50' },
            { label: '평균', value: `${snapshot.weeklyRate}%`, icon: Flame, color: 'text-orange-600 bg-orange-50' },
            { label: '검토', value: snapshot.pendingReviewCount, icon: Search, color: 'text-amber-600 bg-amber-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-2xl p-2 text-center ${color}`}>
              <Icon size={16} className="mx-auto" />
              <p className="mt-1 text-base font-black">{value}</p>
              <p className="text-[9px] font-bold opacity-70">{label}</p>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="학생 이름 검색"
              className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={classId} onChange={(event) => setClassId(event.target.value)} className="rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-xs font-bold text-slate-600">
              <option value="all">전체 반</option>
              {snapshot.classes.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <label className="relative">
              <ArrowUpDown size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pl-8 pr-2 text-xs font-bold text-slate-600">
                <option value="rate-low">수행률 낮은순</option>
                <option value="rate-high">수행률 높은순</option>
                <option value="name">이름순</option>
              </select>
            </label>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              ['ALL', '전체'],
              ['EXCELLENT', '우수'],
              ['CAUTION', '진행중'],
              ['ATTENTION', '관심필요'],
              ['UNSUBMITTED', '미제출'],
            ].map(([key, label]) => (
              <button key={key} onClick={() => {
                const next = key as StatusFilter;
                setStatus(next);
                setSearchParams(next === 'ATTENTION' ? { status: 'attention' } : next === 'UNSUBMITTED' ? { status: 'unsubmitted' } : {});
              }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${status === key ? 'bg-purple-600 text-white' : 'bg-white text-slate-500'}`}>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          {rows.map((row) => {
            const config = statusConfig[row.status];
            return (
              <button key={row.user.id} onClick={() => navigate(`/students/${row.user.id}`)} className="w-full rounded-2xl border border-slate-100 bg-white p-3.5 text-left shadow-sm active:scale-[0.99]">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-50 text-2xl">{row.user.avatar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <strong className="truncate text-sm text-slate-900">{row.user.name}</strong>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${config.bg} ${config.color}`}>{config.label}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{row.className} · 🔥 {row.streak}일 연속</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-3">
                  <div>
                    <div className="mb-1 flex justify-between text-[10px] font-bold text-slate-500">
                      <span>이번주 수행률</span><span>{row.weeklyRate}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${row.weeklyRate >= 70 ? 'bg-emerald-500' : row.weeklyRate >= 40 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${row.weeklyRate}%` }} />
                    </div>
                  </div>
                  <span className="rounded-lg bg-red-50 px-2 py-1 text-[10px] font-black text-red-600">미제출 {row.missed}</span>
                  <span className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-black text-amber-600">검토 {row.pending}</span>
                </div>
              </button>
            );
          })}
        </section>
        </main>}
      </div>
    </div>
  );
}
