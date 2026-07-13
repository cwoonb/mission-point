import { useState } from 'react';
import { ChevronRight, Clock3 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionDisplayStatus } from '../utils/missionStats';
import { calculateClassStats, calculateHomeworkStats, groupMissionsByHomework } from '../utils/missionStats';
import { formatFriendlyDateTime, formatMissionPeriod, getMissionPeriodStatus, missionPeriodLabel } from '../utils/missionDates';

type Filter = 'all' | MissionDisplayStatus;

const FILTERS: Array<[Filter, string]> = [
  ['all', '전체'],
  ['in_progress', '진행 중'],
  ['pending', '승인 대기'],
  ['missing', '미제출'],
  ['completed', '완료'],
];

const typeLabel = { HOMEWORK: '숙제', VOCABULARY: '단어', READING: '독서', ATTENDANCE: '출석', REVIEW_NOTES: '오답노트', LIFESTYLE: '생활', OTHER: '기타' } as const;

export default function MissionClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const users = useAuthStore((state) => state.users);
  const currentUser = useAuthStore((state) => state.currentUser);
  const groups = useGroupStore((state) => state.groups);
  const missions = useMissionStore((state) => state.missions);
  const group = groups.find((item) => item.id === classId);

  if (!group || !currentUser) return <div className="page-container"><Header title="반을 찾을 수 없습니다" showBack /></div>;

  const members = users.filter((user) => user.role === 'CHILD' && user.groupId === group.id);
  const memberIds = new Set(members.map((user) => user.id));
  const assigned = missions.filter((mission) => mission.creatorId === currentUser.id && memberIds.has(mission.assigneeId));
  const homeworkGroups = groupMissionsByHomework(assigned);
  const classStats = calculateClassStats(assigned);
  const visible = homeworkGroups.filter((items) => filter === 'all' || calculateHomeworkStats(items)[filter === 'in_progress' ? 'inProgress' : filter] > 0);

  return <div className="page-container bg-slate-50">
    <Header title={group.name} showBack />
    <main className="content-area space-y-4 px-4 py-4">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-400">학생 {members.length}명 · 이번 주 전체 숙제 {homeworkGroups.length}개</p>
        <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[10px] font-black">
          <span className="rounded-lg bg-emerald-50 py-2 text-emerald-600">완료 {classStats.completed}</span>
          <span className="rounded-lg bg-orange-50 py-2 text-orange-600">승인 대기 {classStats.pending}</span>
          <span className="rounded-lg bg-red-50 py-2 text-red-600">미제출 {classStats.missing}</span>
          <span className="rounded-lg bg-blue-50 py-2 text-blue-600">진행 중 {classStats.inProgress}</span>
        </div>
        {classStats.completionRate === null ? <p className="mt-3 text-sm font-bold text-slate-400">이번 기간에는 등록된 미션이 없습니다.</p> : <div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-purple-500" style={{ width: `${classStats.completionRate}%` }} /></div><span className="text-sm font-black text-purple-600">{classStats.completionRate}%</span></div>}
      </section>

      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {FILTERS.map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`min-h-11 rounded-xl px-1 text-[10px] font-black ${filter === key ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>{label}</button>)}
      </div>

      <section className="space-y-2">
        <h2 className="px-1 font-black text-slate-800">숙제 목록</h2>
        {visible.map((items) => {
          const first = items[0];
          const stats = calculateHomeworkStats(items);
          return <button key={`${first.creatorId}-${first.title}-${first.endDate}`} onClick={() => navigate(`/missions/homework/${first.id}`)} className="w-full rounded-3xl bg-white p-4 text-left shadow-sm">
            <div className="flex items-start gap-3"><Clock3 size={18} className="mt-0.5 text-purple-500"/><div className="min-w-0 flex-1"><h3 className="truncate font-black text-slate-800">{first.title}</h3><p className="text-[11px] font-bold text-slate-400">{formatMissionPeriod(first)} · {typeLabel[first.missionType ?? 'OTHER']}</p><p className="mt-0.5 text-[10px] font-black text-purple-600">{missionPeriodLabel[getMissionPeriodStatus(first)]} · {formatFriendlyDateTime(first.endDate)}까지</p></div><ChevronRight size={17} className="text-slate-300"/></div>
            <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[9px] font-black"><span className="rounded-lg bg-emerald-50 py-1.5 text-emerald-600">완료 {stats.completed}</span><span className="rounded-lg bg-orange-50 py-1.5 text-orange-600">승인 {stats.pending}</span><span className="rounded-lg bg-red-50 py-1.5 text-red-600">미제출 {stats.missing}</span><span className="rounded-lg bg-blue-50 py-1.5 text-blue-600">진행 {stats.inProgress}</span></div>
            {stats.completionRate !== null && <div className="mt-3 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-purple-500" style={{ width: `${stats.completionRate}%` }}/></div><span className="text-xs font-black text-purple-600">{stats.completionRate}%</span></div>}
          </button>;
        })}
        {visible.length === 0 && <div className="rounded-3xl bg-white py-12 text-center text-sm text-slate-400">조건에 맞는 숙제가 없습니다.</div>}
      </section>
    </main>
  </div>;
}
