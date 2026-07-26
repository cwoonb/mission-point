import { useState } from 'react';
import { Filter, Plus, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import SearchInput from '../components/ui/SearchInput';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { calculateClassStats } from '../utils/missionStats';
import { overlapsPeriod } from '../utils/missionDates';
import { getActiveDemoScenario } from '../data/demoSession';
import { getInviteUrl } from '../lib/kakaoShare';

type Period = '7' | '30' | '90' | 'all' | 'custom';
type Status = 'all' | 'active' | 'missing' | 'pending' | 'feedback' | 'recent';
type Sort = 'recent' | 'name' | 'active' | 'missing' | 'pending';

function range(period: Period, start?: string | null, end?: string | null) {
  if (period === 'all') return { start: null, end: null };
  if (period === 'custom') return { start: start ? new Date(`${start}T00:00:00`) : null, end: end ? new Date(`${end}T23:59:59`) : null };
  const finish = new Date(); finish.setHours(23, 59, 59, 999);
  const begin = new Date(); begin.setDate(begin.getDate() - Number(period) + 1); begin.setHours(0, 0, 0, 0);
  return { start: begin, end: finish };
}

function relativeTime(value?: string) {
  if (!value) return '활동 기록 없음';
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}일 전`;
  return new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric' }).format(new Date(value));
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [inviteNotice, setInviteNotice] = useState('');
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  if (!currentUser) return null;
  const scenario = currentUser.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = scenario?.memberLabel ?? '학생';
  const period = (params.get('period') as Period) || '30';
  const status = (params.get('status') as Status) || 'all';
  const sort = (params.get('sort') as Sort) || 'recent';
  const classId = params.get('class') || 'all';
  const query = params.get('q') || '';
  const selectedRange = range(period, params.get('start'), params.get('end'));
  const myGroups = groups.filter((group) => group.facilitatorId === currentUser.id);
  const groupIds = new Set(myGroups.map((group) => group.id));
  const feedbackMissionIds = new Set(reviewLogs.filter((log) => log.reason || log.publicFeedback).map((log) => log.missionId));
  const update = (key: string, value?: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); };

  const rows = users.filter((user) => user.role === 'CHILD' && user.groupId && groupIds.has(user.groupId)).map((user) => {
    const all = missions.filter((mission) => mission.creatorId === currentUser.id && mission.assigneeId === user.id);
    const periodMissions = all.filter((mission) => overlapsPeriod(mission, selectedRange.start, selectedRange.end));
    const stats = calculateClassStats(periodMissions);
    const missionIds = new Set(all.map((mission) => mission.id));
    const dates = [...all.map((mission) => mission.createdAt), ...submissions.filter((item) => missionIds.has(item.missionId)).map((item) => item.submittedAt), ...reviewLogs.filter((item) => missionIds.has(item.missionId)).map((item) => item.createdAt)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    const state = stats.pending > 0 ? '승인 대기' : stats.missing > 0 ? '미제출' : stats.completed > 0 ? '제출 완료' : stats.inProgress > 0 ? '진행 중' : '활동 없음';
    return { user, stats, lastAt: dates[0], feedback: periodMissions.some((mission) => feedbackMissionIds.has(mission.id)), className: myGroups.find((group) => group.id === user.groupId)?.name.replace(/^[^\p{L}\p{N}]+/u, '').trim() ?? '미배정', state };
  }).filter((row) => (classId === 'all' || row.user.groupId === classId) && row.user.name.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'all' || (status === 'active' && row.stats.inProgress > 0) || (status === 'missing' && row.stats.missing > 0) || (status === 'pending' && row.stats.pending > 0) || (status === 'feedback' && row.feedback) || (status === 'recent' && !!row.lastAt))).sort((a, b) => sort === 'name' ? a.user.name.localeCompare(b.user.name) : sort === 'active' ? b.stats.inProgress - a.stats.inProgress : sort === 'missing' ? b.stats.missing - a.stats.missing : sort === 'pending' ? b.stats.pending - a.stats.pending : new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime());
  const allCount = users.filter((user) => user.role === 'CHILD' && user.groupId && groupIds.has(user.groupId)).length;
  const stateTone: Record<string, string> = { '제출 완료': 'bg-[#EAF2EC] text-[#52775E]', '승인 대기': 'bg-[#F8EFE3] text-[#A66D32]', '미제출': 'bg-[#F7ECEA] text-[#A65F59]', '진행 중': 'bg-[#EAF0F6] text-[#536D8B]', '활동 없음': 'bg-[#F0F1F2] text-[#707782]' };

  const copyInvite = async () => { try { await navigator.clipboard.writeText(getInviteUrl(currentUser.id)); setInviteNotice(`${memberLabel} 초대 링크를 복사했습니다.`); } catch { setInviteNotice('초대 링크를 복사하지 못했습니다.'); } window.setTimeout(() => setInviteNotice(''), 1800); };

  return <div className="page-container bg-[#F8F5F0]">
    <Header title={memberLabel} showBack={false} showPoints={false} rightElement={<button aria-label={`${memberLabel} 초대`} onClick={copyInvite} className="flex h-11 w-11 items-center justify-center text-[#14233B]"><Plus size={21}/></button>} />
    <main className="content-area px-4 pt-3">
      {inviteNotice && <p role="status" className="mb-2 rounded-[9px] bg-[#EAF2EC] px-3 py-2 text-center text-xs font-semibold text-[#52775E]">{inviteNotice}</p>}
      <div className="flex gap-2"><div className="min-w-0 flex-1"><SearchInput value={query} onChange={(value) => update('q', value)} placeholder={`${memberLabel} 이름 검색`}/></div><button onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters} className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[10px] border border-[var(--color-border)] bg-[#FFFDFC] px-3 text-xs font-semibold text-[#14233B]"><Filter size={15}/>필터</button></div>
      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide"><button onClick={() => update('class', 'all')} className={`min-h-9 shrink-0 rounded-[9px] px-3 text-xs font-semibold ${classId === 'all' ? 'bg-[#14233B] text-white' : 'bg-[#F1EDE7] text-[#737B86]'}`}>전체 {allCount}</button>{myGroups.map((group) => { const count = users.filter((user) => user.role === 'CHILD' && user.groupId === group.id).length; return <button key={group.id} onClick={() => update('class', group.id)} className={`min-h-9 shrink-0 rounded-[9px] px-3 text-xs font-semibold ${classId === group.id ? 'bg-[#14233B] text-white' : 'bg-[#F1EDE7] text-[#737B86]'}`}>{group.name.replace(/^[^\p{L}\p{N}]+/u, '').trim()} {count}</button>; })}</div>
      {showFilters && <section className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] p-3">
        <select aria-label="조회 기간" value={period} onChange={(event) => update('period', event.target.value)} className="min-h-11 rounded-[9px] border px-2 text-xs"><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 3개월</option><option value="all">전체 기간</option><option value="custom">직접 선택</option></select>
        <select aria-label="상태" value={status} onChange={(event) => update('status', event.target.value)} className="min-h-11 rounded-[9px] border px-2 text-xs"><option value="all">전체 상태</option><option value="active">진행 중</option><option value="missing">미제출</option><option value="pending">승인 대기</option><option value="feedback">피드백 있음</option><option value="recent">최근 활동</option></select>
        <label className="relative col-span-2"><SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#737B86]"/><select aria-label="정렬" value={sort} onChange={(event) => update('sort', event.target.value)} className="min-h-11 w-full rounded-[9px] border pl-9 text-xs"><option value="recent">최근 활동순</option><option value="name">이름순</option><option value="active">진행 중 많은 순</option><option value="missing">미제출 우선</option><option value="pending">승인 대기 우선</option></select></label>
      </section>}
      <section className="mt-3 divide-y divide-[var(--color-border)] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[#FFFDFC]">
        {rows.map((row) => <button key={row.user.id} onClick={() => navigate(`/students/${row.user.id}?period=${period}`)} className="flex min-h-[70px] w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-[#F8F5F0]">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] text-sm font-semibold text-[#14233B]">{row.user.profileImage ? <img src={row.user.profileImage} alt="" loading="lazy" className="h-full w-full object-cover"/> : row.user.name.slice(0,1)}</span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-[15px] font-semibold text-[#27313F]">{row.user.name}</strong><span className="mt-0.5 block text-xs text-[#737B86]">{row.className}</span></span>
          <span className="shrink-0 text-right"><span className={`inline-block rounded-[7px] px-2 py-1 text-[10px] font-semibold ${stateTone[row.state]}`}>{row.state}</span><span className="mt-1 block text-[10px] text-[#9A9FA7]">{relativeTime(row.lastAt)}</span></span>
        </button>)}
        {rows.length === 0 && <div className="p-3"><EmptyState title={`등록된 ${memberLabel}이 없습니다.`} description={`${memberLabel}을 추가하면 미션과 활동 기록을 관리할 수 있습니다.`}/></div>}
      </section>
    </main>
  </div>;
}
