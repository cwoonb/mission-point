import { Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { calculateClassStats, getSubmissionDisplayStatus } from '../utils/missionStats';
import { overlapsPeriod } from '../utils/missionDates';
import { getActiveDemoScenario } from '../data/demoSession';

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

export default function StudentsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  if (!currentUser) return null;
  const demoScenario = currentUser.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = demoScenario?.memberLabel ?? '학생';

  const period = (params.get('period') as Period) || '30';
  const status = (params.get('status') as Status) || 'all';
  const sort = (params.get('sort') as Sort) || 'recent';
  const classId = params.get('class') || 'all';
  const query = params.get('q') || '';
  const selectedRange = range(period, params.get('start'), params.get('end'));
  const myGroups = groups.filter((group) => group.facilitatorId === currentUser.id);
  const groupIds = new Set(myGroups.map((group) => group.id));
  const feedbackMissionIds = new Set(reviewLogs.map((log) => log.missionId));

  const update = (key: string, value?: string) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next); };
  const rows = users.filter((user) => user.role === 'CHILD' && user.groupId && groupIds.has(user.groupId)).map((user) => {
    const all = missions.filter((mission) => mission.creatorId === currentUser.id && mission.assigneeId === user.id);
    const periodMissions = all.filter((mission) => overlapsPeriod(mission, selectedRange.start, selectedRange.end));
    const stats = calculateClassStats(periodMissions);
    const missionIds = new Set(all.map((mission) => mission.id));
    const activityDates = [
      ...all.map((mission) => mission.createdAt),
      ...submissions.filter((submission) => missionIds.has(submission.missionId)).map((submission) => submission.submittedAt),
      ...reviewLogs.filter((log) => missionIds.has(log.missionId)).map((log) => log.createdAt),
    ];
    const lastActivityAt = activityDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    const last = lastActivityAt ? { createdAt: lastActivityAt } : undefined;
    return { user, missions: periodMissions, stats, last, feedback: periodMissions.some((mission) => feedbackMissionIds.has(mission.id)), className: myGroups.find((group) => group.id === user.groupId)?.name ?? '미배정' };
  }).filter((row) => {
    const classMatch = classId === 'all' || row.user.groupId === classId;
    const queryMatch = row.user.name.toLowerCase().includes(query.trim().toLowerCase());
    const statusMatch = status === 'all' || (status === 'active' && row.stats.inProgress > 0) || (status === 'missing' && row.stats.missing > 0) || (status === 'pending' && row.stats.pending > 0) || (status === 'feedback' && row.feedback) || (status === 'recent' && row.missions.length > 0);
    return classMatch && queryMatch && statusMatch;
  }).sort((a, b) => sort === 'name' ? a.user.name.localeCompare(b.user.name) : sort === 'active' ? b.stats.inProgress - a.stats.inProgress : sort === 'missing' ? b.stats.missing - a.stats.missing : sort === 'pending' ? b.stats.pending - a.stats.pending : new Date(b.last?.createdAt ?? 0).getTime() - new Date(a.last?.createdAt ?? 0).getTime());

  const applied = [period !== '30', status !== 'all', sort !== 'recent', classId !== 'all', !!query].filter(Boolean).length;
  return <div className="page-container bg-[#F8F5F0]"><Header title={memberLabel} showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-4">
    <section className="premium-panel p-4">
      <div className="flex items-center justify-between"><div><h2 className="font-bold text-[#14233B]">최근 활동 조회</h2><p className="text-xs text-[#687282]">기본 최근 30일 · 선택 조건 자동 유지</p></div><button onClick={() => setParams({})} className="min-h-11 px-2 text-xs font-bold text-[#14233B]">초기화</button></div>
      <div className="mt-3 grid grid-cols-2 gap-2"><select value={period} onChange={(e) => update('period', e.target.value)} className="min-h-11 rounded-xl bg-slate-50 px-3 text-xs font-bold"><option value="7">최근 7일</option><option value="30">최근 30일</option><option value="90">최근 3개월</option><option value="all">전체 기간</option><option value="custom">직접 선택</option></select><select value={classId} onChange={(e) => update('class', e.target.value)} className="min-h-11 rounded-xl bg-slate-50 px-3 text-xs font-bold"><option value="all">전체 반</option>{myGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></div>
      {period === 'custom' && <div className="mt-2 grid grid-cols-2 gap-2"><input type="date" value={params.get('start') ?? ''} onChange={(e) => update('start', e.target.value)} className="min-h-11 rounded-xl bg-slate-50 px-2 text-xs"/><input type="date" value={params.get('end') ?? ''} onChange={(e) => update('end', e.target.value)} className="min-h-11 rounded-xl bg-slate-50 px-2 text-xs"/></div>}
      <div className="relative mt-2"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={query} onChange={(e) => update('q', e.target.value || undefined)} placeholder={`${memberLabel} 이름 검색`} className="min-h-11 w-full rounded-xl bg-slate-50 pl-9 pr-3 text-sm outline-none"/></div>
      <div className="mt-2 grid grid-cols-2 gap-2"><label className="relative"><Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={status} onChange={(e) => update('status', e.target.value)} className="min-h-11 w-full rounded-xl bg-slate-50 pl-8 text-xs font-bold"><option value="all">전체 상태</option><option value="recent">최근 활동 있음</option><option value="active">진행 중</option><option value="missing">미제출 있음</option><option value="pending">승인 대기 있음</option><option value="feedback">피드백 있음</option></select></label><label className="relative"><SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={sort} onChange={(e) => update('sort', e.target.value)} className="min-h-11 w-full rounded-xl bg-slate-50 pl-8 text-xs font-bold"><option value="recent">최근 활동순</option><option value="name">이름순</option><option value="active">진행 중 많은 순</option><option value="missing">미제출 우선</option><option value="pending">승인 대기 우선</option></select></label></div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{[['missing',`미제출 ${memberLabel}`],['pending','승인 대기'],['feedback','피드백'],['recent','최근 활동']] .map(([key,label]) => <button key={key} onClick={() => update('status', key)} className={`min-h-11 shrink-0 rounded-[10px] border px-3 text-xs font-semibold ${status === key ? 'border-[#14233B] bg-[#14233B] text-white' : 'border-[#E7E1D9] bg-[#FFFDFC] text-[#687282]'}`}>{label}</button>)}</div>
      {applied > 0 && <span className="mt-2 inline-block rounded-[7px] bg-[#E9EDF2] px-2 py-1 text-[10px] font-bold text-[#14233B]">필터 {applied}</span>}
    </section>
    <section className="space-y-2">{rows.map((row) => <button key={row.user.id} onClick={() => navigate(`/students/${row.user.id}?period=${period}`)} className="premium-row w-full p-3 text-left"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EDF2] text-sm font-bold text-[#14233B]">{row.user.name.slice(0,1)}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#14233B]">{row.user.name}</strong><span className="text-[11px] font-medium text-[#687282]">{row.className} · {row.last ? `${new Date(row.last.createdAt).toLocaleDateString('ko-KR')} 최근 활동` : '활동 기록 없음'}</span></span></div>{row.stats.total === 0 ? <p className="mt-2 rounded-[8px] bg-[#F1EDE7] px-3 py-2 text-xs font-medium text-[#687282]">선택한 기간에 배정된 미션 없음</p> : <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[9px] font-semibold"><span className="rounded-[7px] bg-emerald-50 py-1 text-emerald-700">완료 {row.stats.completed}</span><span className="rounded-[7px] bg-blue-50 py-1 text-blue-700">진행 {row.stats.inProgress}</span><span className="rounded-[7px] bg-red-50 py-1 text-red-700">미제출 {row.stats.missing}</span><span className="rounded-[7px] bg-amber-50 py-1 text-amber-700">승인 {row.stats.pending}</span></div>}</button>)}{rows.length === 0 && <div className="premium-panel py-12 text-center"><p className="font-medium text-[#687282]">선택한 기간에 기록된 활동이 없습니다.</p><button onClick={() => update('period','30')} className="mt-3 min-h-11 rounded-[10px] bg-[#14233B] px-4 text-sm font-bold text-white">최근 30일 보기</button></div>}</section>
  </main></div>;
}
