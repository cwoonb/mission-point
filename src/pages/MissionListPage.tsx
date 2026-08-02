import { CalendarClock, CalendarX2, CheckCircle2, Circle, FileText, Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import SegmentTabs from '../components/ui/SegmentTabs';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { calculateHomeworkStats, groupMissionsByHomework } from '../utils/missionStats';
import type { Mission } from '../types';
import ApprovalPage from './ApprovalPage';
import { formatDate, submissionTypeLabel } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';
import { missionInOrganization } from '../utils/membershipScope';

type LeaderTab = 'all' | 'active' | 'due' | 'pending' | 'completed' | 'self';
type PerformerTab = 'all' | 'todo' | 'pending' | 'rejected' | 'completed';

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
  const { missions, submissions, updateStatus } = useMissionStore();
  const activeOrganizationId=useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId)?.organizationId);
  if (!currentUser) return null;

  const rawTab = params.get('tab');
  const tab: LeaderTab = rawTab === 'history' ? 'completed' : ['all', 'active', 'due', 'pending', 'completed', 'self'].includes(rawTab ?? '') ? rawTab as LeaderTab : 'active';
  const query = params.get('q') ?? '';
  const created = missions.filter((mission) => mission.creatorId === currentUser.id&&missionInOrganization(mission,activeOrganizationId));
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
    const isSelf = items.every((mission) => mission.assigneeId === currentUser.id);
    return { items, first, stats, submitted, groupName: isSelf ? '내 업무' : groupNames.length === 1 ? groupNames[0] : '전체', hasActive, hasPending, isCompleted, isSelf };
  });
  const rows = groupRows.filter((row) => {
    const matchesQuery = row.first.title.toLowerCase().includes(query.trim().toLowerCase());
    if (!matchesQuery) return false;
    if (tab === 'all') return true;
    if (tab === 'self') return row.isSelf;
    if (tab === 'active') return !row.isSelf && row.hasActive && !row.isCompleted;
    if (tab === 'due') return localDateKey(new Date(row.first.endDate)) === todayKey && !row.isCompleted;
    if (tab === 'pending') return row.hasPending;
    return row.isCompleted;
  });
  const tabCounts = {
    all: groupRows.length,
    active: groupRows.filter((row) => !row.isSelf && row.hasActive && !row.isCompleted).length,
    due: groupRows.filter((row) => localDateKey(new Date(row.first.endDate)) === todayKey && !row.isCompleted).length,
    pending: groupRows.filter((row) => row.hasPending).length,
    completed: groupRows.filter((row) => row.isCompleted).length,
    self: groupRows.filter((row) => row.isSelf).length,
  };
  const tabs = [
    { key: 'all' as const, label: '전체', count: tabCounts.all },
    { key: 'active' as const, label: '진행 중', count: tabCounts.active },
    { key: 'due' as const, label: '오늘 마감', count: tabCounts.due },
    { key: 'pending' as const, label: '승인 대기', count: tabCounts.pending },
    { key: 'completed' as const, label: '완료', count: tabCounts.completed },
    { key: 'self' as const, label: '내 할 일', count: tabCounts.self },
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
        {rows.map(({ first, stats, submitted, groupName, isSelf }) => {
          const days = dDay(first.endDate);
          if (isSelf) return <div key={first.id} className="flex min-h-[72px] items-center gap-2 rounded-[13px] border border-[var(--color-border)] bg-[#FFFDFC] px-3 py-2 shadow-[0_2px_10px_rgba(20,35,59,.025)]"><button type="button" onClick={() => updateStatus(first.id, first.status === 'SUCCESS' ? 'IN_PROGRESS' : 'SUCCESS')} aria-label={first.status === 'SUCCESS' ? `${first.title} 다시 열기` : `${first.title} 완료`} className={`flex h-11 w-11 shrink-0 items-center justify-center ${first.status === 'SUCCESS' ? 'text-[#52775E]' : 'text-[#9299A3]'}`}>{first.status === 'SUCCESS' ? <CheckCircle2 size={22}/> : <Circle size={22}/>}</button><button type="button" onClick={() => navigate(`/missions/${first.id}`)} className="min-w-0 flex-1 py-2 text-left"><strong className={`block truncate text-sm ${first.status === 'SUCCESS' ? 'text-[#8B929C] line-through' : 'text-[#27313F]'}`}>{first.title}</strong><span className={`mt-1 flex items-center gap-1 text-[10px] ${first.status !== 'SUCCESS' && days <= 0 ? 'font-semibold text-[#A65F59]' : 'text-[#8B929C]'}`}><CalendarClock size={11}/>{days === 0 ? '오늘까지' : formatDate(first.endDate)}</span>{first.description !== first.title && <span className="mt-1 block truncate text-[10px] text-[#8B929C]">{first.description}</span>}</button></div>;
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
        {rows.length === 0 && <EmptyState icon={CalendarX2} title={tab === 'self' ? '등록한 내 할 일이 없습니다.' : '선택한 조건에 맞는 미션이 없습니다.'} description={tab === 'self' ? '학생 관리와 리포팅 업무를 직접 기록해 보세요.' : '다른 필터를 선택하거나 새 미션을 등록해보세요.'} actionLabel={tab === 'self' ? '내 할 일 작성' : '새 미션 만들기'} onAction={() => navigate(tab === 'self' ? '/missions/create?target=self' : '/missions/create')} />}
      </section>}
    </main>
  </div>;
}

function PerformerMissionList() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const groups = useGroupStore((state) => state.groups);
  const [params, setParams] = useSearchParams();
  const activeOrganizationId=useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId)?.organizationId);
  if (!currentUser) return null;
  const tab = (['all', 'todo', 'pending', 'rejected', 'completed'].includes(params.get('tab') ?? '') ? params.get('tab') : 'todo') as PerformerTab;
  const query = params.get('q') ?? '';
  const mine = missions.filter((mission) => mission.assigneeId === currentUser.id&&missionInOrganization(mission,activeOrganizationId));
  const attempts = (missionId: string) => submissions.filter((submission) => submission.missionId === missionId).length;
  const matchesTab = (mission: Mission) => tab === 'all' || (tab === 'todo' && ['PENDING','IN_PROGRESS'].includes(mission.status)) || (tab === 'pending' && mission.status === 'REVIEWING') || (tab === 'rejected' && mission.status === 'REJECTED') || (tab === 'completed' && mission.status === 'SUCCESS');
  const shown = mine.filter((mission) => matchesTab(mission) && mission.title.toLowerCase().includes(query.toLowerCase())).sort((a,b)=>new Date(a.endDate).getTime()-new Date(b.endDate).getTime());
  const tabs = [{ key: 'all' as const, label: '전체', count: mine.length }, { key: 'todo' as const, label: '해야 할 미션', count: mine.filter((mission)=>['PENDING','IN_PROGRESS'].includes(mission.status)).length }, { key: 'pending' as const, label: '승인 대기', count: mine.filter((mission)=>mission.status==='REVIEWING').length }, { key: 'rejected' as const, label: '수정 요청', count: mine.filter((mission)=>mission.status==='REJECTED').length }, { key: 'completed' as const, label: '완료', count: mine.filter((mission)=>mission.status==='SUCCESS').length }];
  const update = (key: string, value: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); };
  const today = localDateKey(new Date());
  const status = (mission: Mission) => { const count=attempts(mission.id); if(mission.status==='SUCCESS')return count>1?'승인 완료':'승인 완료'; if(mission.status==='REJECTED')return '수정 요청'; if(mission.status==='REVIEWING')return count>1?'재제출 완료':'승인 대기'; if(mission.status==='PENDING'||new Date(mission.startDate)>new Date())return '시작 전'; if(localDateKey(new Date(mission.endDate))===today)return '오늘 마감'; return '진행 중'; };
  const groupName = groups.find((group)=>group.id===currentUser.groupId)?.name ?? '소속 없음';
  return <div className="page-container bg-[#F8F5F0]"><Header title="미션" showBack={false} showPoints={false}/><main className="content-area px-4 pt-3"><SearchInput value={query} onChange={(value) => update('q', value)} placeholder="미션 검색"/><div className="mt-3"><SegmentTabs tabs={tabs} value={tab} onChange={(value) => update('tab', value)} ariaLabel="미션 상태"/></div><section className="mt-3 space-y-2 pb-6">{shown.map((mission) => { const hasFeedback=reviewLogs.some((log)=>log.missionId===mission.id&&!!(log.reason||log.publicFeedback)); const latest=[...submissions].filter(item=>item.missionId===mission.id).sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime())[0]; return <button type="button" key={mission.id} onClick={()=>navigate(`/missions/${mission.id}`)} className="flex min-h-[78px] w-full items-center gap-3 rounded-[13px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left"><span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#EEE9E2] text-[#8A7350]">{latest?.imageUrl?<img src={latest.imageUrl} alt="" className="h-full w-full object-cover"/>:<FileText size={18}/>}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-[14px] text-[#14233B]">{mission.title}</strong><span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold ${mission.status==='REJECTED'?'bg-[#F7ECEA] text-[#A65F59]':mission.status==='SUCCESS'?'bg-[#EAF2EC] text-[#52775E]':mission.status==='REVIEWING'?'bg-[#F8EFE3] text-[#A66D32]':'bg-[#EAF0F6] text-[#536D8B]'}`}>{status(mission)}</span></span><span className="mt-1 block text-[11px] text-[#737B86]">{groupName} · {formatDate(mission.endDate)}까지</span><span className="mt-1 block text-[10px] text-[#8B929C]">{submissionTypeLabel[mission.submissionType]}{hasFeedback?' · 피드백 있음':''}</span></span></button>;})}{shown.length===0&&<EmptyState title={tab==='all'?'현재 진행할 미션이 없습니다.':'조건에 맞는 미션이 없습니다.'} description={tab==='all'?'새로운 미션이 등록되면 여기에 표시됩니다.':undefined}/>}</section></main></div>;
}

export default function MissionListPage() {
  const active = useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId));
  return active?.role === 'STUDENT' ? <PerformerMissionList /> : <LeaderMissionList />;
}
