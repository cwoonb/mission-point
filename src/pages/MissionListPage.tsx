import { CalendarX2, ChevronRight, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import MissionCard from '../components/mission/MissionCard';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import SegmentTabs from '../components/ui/SegmentTabs';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { calculateHomeworkStats, groupMissionsByHomework } from '../utils/missionStats';
import type { Mission } from '../types';
import ApprovalPage from './ApprovalPage';

type LeaderTab = 'all' | 'active' | 'due' | 'pending' | 'completed';
type PerformerTab = 'all' | 'active' | 'completed';

const formatShortDate = (value: string) => new Intl.DateTimeFormat('ko-KR', { month: '2-digit', day: '2-digit' }).format(new Date(value)).replace(/\. /g, '.').replace('.', '');
const localDateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

function dDay(endDate: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(endDate); end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86400000);
}

function dDayTone(days: number) {
  if (days <= 1) return 'bg-[#F7ECEA] text-[#A65F59]';
  if (days <= 3) return 'bg-[#F8EFE3] text-[#A66D32]';
  return 'bg-[#EAF0F6] text-[#536D8B]';
}

function LeaderMissionList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions } = useMissionStore();
  if (!currentUser) return null;

  const rawTab = params.get('tab');
  const tab: LeaderTab = rawTab === 'history' ? 'completed' : ['all', 'active', 'due', 'pending', 'completed'].includes(rawTab ?? '') ? rawTab as LeaderTab : 'active';
  const query = params.get('q') ?? '';
  const created = missions.filter((mission) => mission.creatorId === currentUser.id);
  const homework = groupMissionsByHomework(created).sort((a, b) => new Date(a[0].endDate).getTime() - new Date(b[0].endDate).getTime());
  const todayKey = localDateKey(new Date());
  const groupRows = homework.map((items) => {
    const first = items[0];
    const stats = calculateHomeworkStats(items);
    const submitted = items.filter((mission) => submissions.some((submission) => submission.missionId === mission.id)).length;
    const groupIds = new Set(items.map((mission) => users.find((user) => user.id === mission.assigneeId)?.groupId).filter(Boolean));
    const groupNames = [...groupIds].map((id) => groups.find((group) => group.id === id)?.name.replace(/^[^\p{L}\p{N}]+/u, '').trim()).filter(Boolean);
    const hasActive = stats.inProgress > 0;
    const hasPending = stats.pending > 0;
    const isCompleted = stats.total > 0 && stats.completed === stats.total;
    return { items, first, stats, submitted, groupName: groupNames.length === 1 ? groupNames[0] : '전체', hasActive, hasPending, isCompleted };
  });
  const rows = groupRows.filter((row) => {
    const matchesQuery = row.first.title.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (tab === 'all') return true;
    if (tab === 'active') return row.hasActive && !row.isCompleted;
    if (tab === 'due') return localDateKey(new Date(row.first.endDate)) === todayKey && !row.isCompleted;
    if (tab === 'pending') return row.hasPending;
    return row.isCompleted;
  });
  const tabCounts = {
    all: groupRows.length,
    active: groupRows.filter((row) => row.hasActive && !row.isCompleted).length,
    due: groupRows.filter((row) => localDateKey(new Date(row.first.endDate)) === todayKey && !row.isCompleted).length,
    pending: groupRows.filter((row) => row.hasPending).length,
    completed: groupRows.filter((row) => row.isCompleted).length,
  };
  const tabs = [
    { key: 'all' as const, label: '전체', count: tabCounts.all },
    { key: 'active' as const, label: '진행 중', count: tabCounts.active },
    { key: 'due' as const, label: '오늘 마감', count: tabCounts.due },
    { key: 'pending' as const, label: '승인 대기', count: tabCounts.pending },
    { key: 'completed' as const, label: '완료', count: tabCounts.completed },
  ];
  const update = (next: { tab?: LeaderTab; q?: string }) => {
    const search = new URLSearchParams(params);
    if (next.tab) search.set('tab', next.tab);
    if (next.q !== undefined) next.q ? search.set('q', next.q) : search.delete('q');
    setParams(search, { replace: true });
  };

  return <div className="page-container bg-[#F8F5F0]">
    <Header title="미션" showBack={false} showPoints={false} rightElement={<button onClick={() => navigate('/missions/create')} aria-label="새 미션 만들기" className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#14233B] text-white"><Plus size={20}/></button>} />
    <main className="content-area px-4 pt-3">
      <SearchInput value={query} onChange={(value) => update({ q: value })} placeholder="미션 검색" />
      <div className="mt-3"><SegmentTabs tabs={tabs} value={tab} onChange={(value) => update({ tab: value })} ariaLabel="미션 상태" /></div>
      {tab === 'pending' && !query ? <div className="-mx-4 mt-1"><ApprovalPage embedded /></div> : <section className="mt-3 space-y-2 pb-5">
        {rows.map(({ first, stats, submitted, groupName }) => {
          const days = dDay(first.endDate);
          return <button key={`${first.creatorId}-${first.title}-${first.endDate}`} onClick={() => navigate(`/missions/homework/${first.id}`)} className="w-full rounded-[13px] border border-[var(--color-border)] bg-[#FFFDFC] px-4 py-3.5 text-left shadow-[0_2px_10px_rgba(20,35,59,.025)]">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#14233B]">{first.title}</h2>
                <p className="mt-1 text-[11px] text-[#737B86]">{groupName} · {formatShortDate(first.startDate)} ~ {formatShortDate(first.endDate)}</p>
                <p className="mt-2 text-[12px] text-[#53606F]">제출 {submitted}명{stats.pending > 0 ? ` · 승인 대기 ${stats.pending}명` : stats.missing > 0 ? ` · 미제출 ${stats.missing}명` : ''}</p>
              </div>
              <div className="flex min-h-[64px] shrink-0 flex-col items-end justify-between">
                <span className={`rounded-[7px] px-2 py-1 text-[10px] font-semibold ${stats.completed === stats.total && stats.total > 0 ? 'bg-[#EAF2EC] text-[#52775E]' : dDayTone(days)}`}>{stats.completed === stats.total && stats.total > 0 ? '완료' : days < 0 ? '마감' : days === 0 ? 'D-Day' : `D-${days}`}</span>
                <span className="text-xs font-semibold text-[#14233B]">{submitted}/{stats.total}</span>
              </div>
            </div>
          </button>;
        })}
        {rows.length === 0 && <EmptyState icon={CalendarX2} title="선택한 조건에 맞는 미션이 없습니다." description="다른 필터를 선택하거나 새 미션을 등록해보세요." actionLabel="새 미션 만들기" onAction={() => navigate('/missions/create')} />}
      </section>}
    </main>
  </div>;
}

function PerformerMissionList() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const missions = useMissionStore((state) => state.missions);
  const [params, setParams] = useSearchParams();
  if (!currentUser) return null;
  const tab = (['all', 'active', 'completed'].includes(params.get('tab') ?? '') ? params.get('tab') : 'active') as PerformerTab;
  const query = params.get('q') ?? '';
  const mine = missions.filter((mission) => mission.assigneeId === currentUser.id);
  const shown = mine.filter((mission) => (tab === 'all' || (tab === 'completed' ? mission.status === 'SUCCESS' : mission.status !== 'SUCCESS')) && mission.title.toLowerCase().includes(query.toLowerCase()));
  const tabs = [{ key: 'all' as const, label: '전체', count: mine.length }, { key: 'active' as const, label: '진행 중', count: mine.filter((m) => m.status !== 'SUCCESS').length }, { key: 'completed' as const, label: '완료', count: mine.filter((m) => m.status === 'SUCCESS').length }];
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); };
  return <div className="page-container bg-[#F8F5F0]"><Header title="미션" showBack={false} showPoints={false}/><main className="content-area px-4 pt-3"><SearchInput value={query} onChange={(value) => update('q', value)} placeholder="미션 검색"/><div className="mt-3"><SegmentTabs tabs={tabs} value={tab} onChange={(value) => update('tab', value)} ariaLabel="미션 상태"/></div><section className="mt-3 space-y-2">{shown.map((mission) => <MissionCard key={mission.id} mission={mission}/>)}</section></main></div>;
}

export default function MissionListPage() {
  const viewMode = useAuthStore((state) => state.viewMode);
  return viewMode === 'FACILITATOR' ? <LeaderMissionList /> : <PerformerMissionList />;
}
