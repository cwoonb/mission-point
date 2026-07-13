import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, CalendarDays, List, X } from 'lucide-react';
import Header from '../components/layout/Header';
import MissionCard from '../components/mission/MissionCard';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import type { Mission, MissionStatus } from '../types';
import ApprovalPage from './ApprovalPage';
import { useGroupStore } from '../store/groupStore';
import { calculateClassStats, groupMissionsByHomework } from '../utils/missionStats';
import { getActiveDemoScenario } from '../data/demoSession';

type FilterTab = 'all' | 'active' | 'done';
type ViewMode = 'list' | 'calendar';

const filterConfig: Array<{ key: FilterTab; label: string; statuses: MissionStatus[] }> = [
  { key: 'all', label: '전체', statuses: [] },
  { key: 'active', label: '진행중', statuses: ['IN_PROGRESS', 'REVIEWING', 'REJECTED', 'PENDING'] },
  { key: 'done', label: '완료', statuses: ['SUCCESS', 'FAILED', 'EXPIRED'] },
];

const DOT_COLOR: Record<MissionStatus, string> = {
  SUCCESS: 'bg-emerald-500',
  IN_PROGRESS: 'bg-amber-400',
  REVIEWING: 'bg-blue-400',
  REJECTED: 'bg-red-400',
  FAILED: 'bg-red-400',
  EXPIRED: 'bg-gray-300',
  PENDING: 'bg-gray-300',
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const cleanGroupName = (name: string) => name.replace(/^[^\p{L}\p{N}]+/u, '').trim();

function LeaderClassMissionOverview() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  if (!currentUser) return null;
  const scenario = currentUser.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = scenario?.memberLabel ?? '학생';
  const groupLabel = scenario?.groupLabel ?? '반';
  const children = users.filter((user) => user.role === 'CHILD');
  const created = missions.filter((mission) => mission.creatorId === currentUser.id);
  const classRows = groups.filter((group) => group.facilitatorId === currentUser.id).map((group) => {
    const members = children.filter((user) => user.groupId === group.id);
    const memberIds = new Set(members.map((user) => user.id));
    const assigned = created.filter((mission) => memberIds.has(mission.assigneeId));
    const homework = groupMissionsByHomework(assigned);
    const titles = homework.map((items) => items[0].title);
    const stats = calculateClassStats(assigned);
    return { group, members, titles, stats };
  });

  const totalStats = calculateClassStats(created);
  return <div className="space-y-3 px-3 py-3">
    <section className="grid grid-cols-4 gap-2">
      {[[children.length, `전체 ${memberLabel}`, 'bg-purple-50 text-purple-700'], [totalStats.inProgress, '진행 중', 'bg-blue-50 text-blue-700'], [totalStats.missing, '미제출', 'bg-red-50 text-red-700'], [totalStats.pending, '검토 대기', 'bg-orange-50 text-orange-700']].map(([value, label, color]) => <div key={label as string} className={`rounded-2xl p-2 text-center ${color}`}><p className="text-lg font-black">{value as number}</p><p className="text-[9px] font-bold">{label as string}</p></div>)}
    </section>
    <div className="flex items-center justify-between px-1"><h2 className="font-black text-slate-800">{groupLabel}별 미션 현황</h2><span className="text-[11px] font-bold text-slate-400">미제출 {totalStats.missing}건</span></div>
    {classRows.length === 0 ? <div className="rounded-3xl bg-white px-5 py-12 text-center shadow-sm"><p className="font-black text-slate-700">등록된 {groupLabel}이 없습니다.</p><button onClick={() => navigate('/students')} className="mt-3 min-h-11 rounded-xl bg-purple-600 px-4 text-sm font-black text-white">{memberLabel} 관리</button></div> : classRows.map(({ group, members, titles, stats }) => <button key={group.id} onClick={() => navigate(`/missions/class/${group.id}`)} className="premium-row w-full p-4 text-left active:scale-[0.99]">
      <div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#E9EDF2] text-sm font-bold text-[#14233B]">{cleanGroupName(group.name).slice(0,1)}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between"><h3 className="font-black text-slate-900">{cleanGroupName(group.name)}</h3><ChevronRight size={17} className="text-slate-300" /></div><p className="text-[11px] font-bold text-slate-400">{memberLabel} {members.length}명 · 미션 {titles.length}개</p><div className="mt-2 space-y-0.5">{titles.slice(0, 2).map((title) => <p key={title} className="truncate text-xs font-bold text-slate-600">{title}</p>)}{titles.length > 2 && <p className="text-[10px] text-slate-400">외 {titles.length - 2}개</p>}</div></div></div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[9px] font-black"><span className="rounded-lg bg-emerald-50 py-1.5 text-emerald-600">완료 {stats.completed}</span><span className="rounded-lg bg-orange-50 py-1.5 text-orange-600">승인 {stats.pending}</span><span className="rounded-lg bg-red-50 py-1.5 text-red-600">미제출 {stats.missing}</span><span className="rounded-lg bg-blue-50 py-1.5 text-blue-600">진행 {stats.inProgress}</span></div>
      {stats.completionRate === null && <p className="mt-3 text-xs font-bold text-slate-400">등록된 미션 없음</p>}
    </button>)}
  </div>;
}

function CalendarView({ missions }: { missions: Mission[] }) {
  const navigate = useNavigate();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(() => new Date().getDate());

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  // missions grouped by endDate day
  const byDay = new Map<number, Mission[]>();
  for (const m of missions) {
    const d = new Date(m.endDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day)!.push(m);
    }
  }

  const selectedMissions = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-4 pb-4 space-y-3">
      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm">
        <button onClick={prevMonth} className="p-1.5 rounded-xl bg-gray-100 active:scale-90 transition-transform">
          <ChevronLeft size={16} className="text-gray-600" />
        </button>
        <p className="font-black text-gray-800">{year}년 {month + 1}월</p>
        <button onClick={nextMonth} className="p-1.5 rounded-xl bg-gray-100 active:scale-90 transition-transform">
          <ChevronRight size={16} className="text-gray-600" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-50">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`py-2 text-center text-[11px] font-bold ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
          ))}
        </div>
        {/* Cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const dayMissions = day ? (byDay.get(day) ?? []) : [];
            const isToday = isCurrentMonth && day === today.getDate();
            const isSelected = day === selectedDay;
            const col = i % 7;
            return (
              <button key={i} disabled={!day}
                onClick={() => day && setSelectedDay(isSelected ? null : day)}
                className={`relative py-1.5 flex flex-col items-center gap-0.5 min-h-[52px] transition-all ${isSelected ? 'bg-purple-50' : 'hover:bg-gray-50'} ${!day ? 'pointer-events-none' : ''}`}>
                {day && (
                  <>
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all
                      ${isToday ? 'bg-purple-600 text-white' : isSelected ? 'text-purple-600' : col === 0 ? 'text-red-400' : col === 6 ? 'text-blue-400' : 'text-gray-700'}`}>
                      {day}
                    </span>
                    <div className="flex gap-0.5 flex-wrap justify-center px-0.5">
                      {dayMissions.slice(0, 3).map((m, mi) => (
                        <span key={mi} className={`w-1.5 h-1.5 rounded-full ${DOT_COLOR[m.status]}`} />
                      ))}
                      {dayMissions.length > 3 && <span className="text-[8px] text-gray-400">+{dayMissions.length - 3}</span>}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day missions */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-bold text-gray-500">{month + 1}월 {selectedDay}일 마감 미션 {selectedMissions.length}개</p>
              <button onClick={() => setSelectedDay(null)}><X size={14} className="text-gray-400" /></button>
            </div>
            {selectedMissions.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
                <p className="text-gray-400 text-sm">이 날 마감 미션이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedMissions.map((m) => (
                  <MissionCard key={m.id} mission={m} showAssignee />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MissionListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser, viewMode } = useAuthStore();
  const { missions } = useMissionStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMode, setDisplayMode] = useState<ViewMode>('list');

  if (!currentUser) return null;

  const isFacilitator = viewMode === 'FACILITATOR';

  if (isFacilitator) {
    const requestedTab = searchParams.get('tab');
    const normalizedTab = requestedTab === 'history' ? 'completed' : requestedTab;
    const leaderTab = ['all', 'active', 'due', 'pending', 'completed'].includes(normalizedTab ?? '')
      ? normalizedTab as 'all' | 'active' | 'due' | 'pending' | 'completed' : 'all';
    const createdMissions = missions.filter((mission) => mission.creatorId === currentUser.id);
    const pendingCount = createdMissions.filter((mission) => mission.status === 'REVIEWING').length;
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const activeMissions = createdMissions.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REJECTED'].includes(mission.status));
    const dueMissions = createdMissions.filter((mission) => mission.endDate.slice(0, 10) === todayKey && mission.status !== 'SUCCESS');
    const completedMissions = createdMissions.filter((mission) => mission.status === 'SUCCESS');
    const leaderTabs = [
      { key: 'all', label: '전체', count: createdMissions.length },
      { key: 'active', label: '진행 중', count: activeMissions.length },
      { key: 'due', label: '오늘 마감', count: dueMissions.length },
      { key: 'pending', label: '승인 대기', count: pendingCount },
      { key: 'completed', label: '완료', count: completedMissions.length },
    ] as const;
    const filteredLeaderMissions = leaderTab === 'active' ? activeMissions : leaderTab === 'due' ? dueMissions : completedMissions;

    return (
      <div className="page-container bg-slate-50">
        <Header
          title="미션"
          showBack={false}
          rightElement={
            <button onClick={() => navigate('/missions/create')} aria-label="미션 만들기" className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#14233B] text-white"><Plus size={18} /></button>
          }
        />
        <div className="content-area">
          <div className="sticky top-0 z-30 border-b border-slate-100 bg-slate-50/95 px-3 py-2 backdrop-blur">
            <div className="flex gap-1 overflow-x-auto rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-1 scrollbar-hide">
              {leaderTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSearchParams(tab.key === 'all' ? {} : { tab: tab.key })}
                  className={`relative min-h-11 shrink-0 rounded-[9px] px-3 text-[11px] font-bold transition-colors ${leaderTab === tab.key ? 'bg-[#14233B] text-white' : 'text-[#687282]'}`}
                >
                  {tab.label}
                  {tab.count > 0 && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] ${leaderTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>}
                </button>
              ))}
            </div>
          </div>
          {leaderTab === 'pending' ? <ApprovalPage embedded /> : leaderTab === 'all' ? <LeaderClassMissionOverview /> : <div className="space-y-2 px-4 py-4">{filteredLeaderMissions.map((mission) => <MissionCard key={mission.id} mission={mission} showAssignee />)}{filteredLeaderMissions.length === 0 && <p className="premium-panel py-12 text-center text-sm text-[#687282]">해당 상태의 미션이 없습니다.</p>}</div>}
        </div>
      </div>
    );
  }

  const baseMissions = isFacilitator
    ? missions.filter((m) => m.creatorId === currentUser.id)
    : missions.filter((m) => m.assigneeId === currentUser.id);

  const filteredTab = filterConfig.find((f) => f.key === activeTab)!;
  const tabFiltered = activeTab === 'all' ? baseMissions : baseMissions.filter((m) => filteredTab.statuses.includes(m.status));

  const searched = searchQuery
    ? tabFiltered.filter((m) => m.title.includes(searchQuery) || m.description.includes(searchQuery))
    : tabFiltered;

  const sorted = [...searched].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="page-container">
      <Header
        title="미션"
        showBack={false}
        rightElement={
          isFacilitator ? (
            <button onClick={() => navigate('/missions/create')}
              className="w-8 h-8 bg-purple-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-md">
              <Plus size={16} />
            </button>
          ) : undefined
        }
      />

      <div className="content-area">
        {/* 검색바 */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="미션 검색..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-2xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        {/* 뷰 모드 + 탭 필터 */}
        <div className="px-4 pb-3 space-y-2">
          {/* 뷰 토글 */}
          <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
            <button onClick={() => setDisplayMode('list')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${displayMode === 'list' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>
              <List size={14} /> 목록
            </button>
            <button onClick={() => setDisplayMode('calendar')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${displayMode === 'calendar' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>
              <CalendarDays size={14} /> 달력
            </button>
          </div>
          {/* 상태 탭 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {filterConfig.map((tab) => {
              const count = tab.key === 'all' ? baseMissions.length : baseMissions.filter((m) => tab.statuses.includes(m.status)).length;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-purple-500 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-600'}`}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 캘린더 or 리스트 */}
        {displayMode === 'calendar' ? (
          <CalendarView missions={sorted} />
        ) : (
          <div className="px-4 pb-4 space-y-3">
            {sorted.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-5xl mb-3">📭</p>
                <p className="text-gray-500 font-semibold">미션이 없어요</p>
                {isFacilitator && (
                  <button onClick={() => navigate('/missions/create')}
                    className="mt-4 btn-primary text-sm py-2 px-5 rounded-xl inline-flex items-center gap-1">
                    <Plus size={14} /> 새 미션 만들기
                  </button>
                )}
              </div>
            ) : (
              sorted.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <MissionCard mission={m} showAssignee={isFacilitator} />
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
