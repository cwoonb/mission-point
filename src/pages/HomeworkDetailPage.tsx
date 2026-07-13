import { useState } from 'react';
import { CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionDisplayStatus } from '../utils/missionStats';
import { calculateHomeworkStats, getLatestReviewByMission, getLatestSubmissionByMission, groupMissionsByHomework, missionsByDisplayStatus } from '../utils/missionStats';

type Filter = 'all' | MissionDisplayStatus;
const FILTERS: Array<[Filter, string]> = [['all', '전체'], ['completed', '완료'], ['pending', '승인 대기'], ['missing', '미제출'], ['in_progress', '진행 중']];
const typeLabel = { HOMEWORK: '숙제', VOCABULARY: '단어', READING: '독서', ATTENDANCE: '출석', REVIEW_NOTES: '오답노트', LIFESTYLE: '생활', OTHER: '기타' } as const;

export default function HomeworkDetailPage() {
  const { homeworkId } = useParams<{ homeworkId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const users = useAuthStore((state) => state.users);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const base = missions.find((mission) => mission.id === homeworkId);
  if (!base) return <div className="page-container"><Header title="숙제를 찾을 수 없습니다" showBack /></div>;

  const cohort = groupMissionsByHomework(missions.filter((mission) => mission.creatorId === base.creatorId)).find((items) => items.some((mission) => mission.id === base.id)) ?? [base];
  const stats = calculateHomeworkStats(cohort);
  const shown = missionsByDisplayStatus(cohort, filter);

  return <div className="page-container bg-slate-50">
    <Header title={base.title} showBack showPoints={false}/>
    <main className="content-area space-y-4 px-4 py-4">
      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-slate-400">{typeLabel[base.missionType ?? 'OTHER']} · {new Date(base.endDate).toLocaleString('ko-KR', { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}까지</p>
        <div className="mt-3 grid grid-cols-5 gap-1 text-center"><div><p className="text-xl font-black text-slate-800">{stats.total}</p><p className="text-[9px] text-slate-400">전체 학생</p></div><div><p className="text-xl font-black text-emerald-600">{stats.completed}</p><p className="text-[9px] text-slate-400">완료</p></div><div><p className="text-xl font-black text-orange-600">{stats.pending}</p><p className="text-[9px] text-slate-400">승인 대기</p></div><div><p className="text-xl font-black text-red-600">{stats.missing}</p><p className="text-[9px] text-slate-400">미제출</p></div><div><p className="text-xl font-black text-blue-600">{stats.inProgress}</p><p className="text-[9px] text-slate-400">진행 중</p></div></div>
        <div className="mt-4 flex items-center gap-2"><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-purple-500" style={{ width: `${stats.completionRate}%` }}/></div><span className="text-xs font-black text-purple-600">{stats.completionRate}%</span></div>
      </section>

      <div className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-1 shadow-sm">{FILTERS.map(([key, label]) => { const count = key === 'all' ? stats.total : key === 'in_progress' ? stats.inProgress : stats[key]; return <button key={key} onClick={() => setFilter(key)} className={`min-h-11 rounded-xl px-0.5 text-[9px] font-black ${filter === key ? 'bg-purple-600 text-white' : 'text-slate-500'}`}>{label} {count}</button>; })}</div>

      <section className="space-y-2">{shown.map((mission) => {
        const student = users.find((user) => user.id === mission.assigneeId);
        const latestSubmission = getLatestSubmissionByMission(submissions, mission.id);
        const latestReview = getLatestReviewByMission(reviewLogs, mission.id);
        const displayStatus = missionsByDisplayStatus([mission], 'all').length ? (mission.status === 'SUCCESS' || String(mission.status) === 'COMPLETED' ? '완료' : mission.status === 'REVIEWING' || String(mission.status) === 'SUBMITTED' ? '승인 대기' : missionsByDisplayStatus([mission], 'missing').length ? '미제출' : '진행 중') : '진행 중';
        return <button key={mission.id} onClick={() => navigate(`/missions/${mission.id}`)} className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm">
          <span className="flex min-h-12 items-center gap-3"><span className="text-2xl">{student?.avatar || '👤'}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-slate-800">{student?.name ?? '알 수 없는 학생'}</span><span className="text-[11px] font-bold text-slate-400">{displayStatus}</span></span>{displayStatus === '완료' && <CheckCircle2 size={18} className="text-emerald-500"/>}<ChevronRight size={16} className="text-slate-300"/></span>
          {(latestSubmission || latestReview) && <span className="mt-1 block pl-11 text-[10px] font-bold text-slate-400">{latestSubmission && `${new Date(latestSubmission.submittedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} 제출`}{latestSubmission && latestReview && ' · '}{latestReview && `${new Date(latestReview.createdAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' })} ${latestReview.action === 'APPROVED' ? '승인 완료' : '반려'}`}</span>}
        </button>;
      })}{shown.length === 0 && <div className="rounded-3xl bg-white py-12 text-center text-sm text-slate-400">해당 상태의 학생이 없습니다.</div>}</section>
    </main>
  </div>;
}
