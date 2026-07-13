import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ClipboardCheck, Lightbulb, Plus, UserPlus } from 'lucide-react';
import PerformerHome from '../components/home/PerformerHome';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useGroupStore } from '../store/groupStore';
import { buildLeaderSnapshot } from '../utils/leaderAnalytics';
import {
  filterMissionsByAnalyticsPeriod,
  getAnalyticsPeriodLabel,
  useAnalyticsPeriodStore,
} from '../store/analyticsPeriodStore';
import { getActiveDemoScenario } from '../data/demoSession';

function FacilitatorHome() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  const { selectedPeriod, customStart, customEnd } = useAnalyticsPeriodStore();

  if (!currentUser) return null;
  const demoScenario = currentUser.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = demoScenario?.memberLabel ?? '학생';

  const periodMissions = filterMissionsByAnalyticsPeriod(missions, selectedPeriod, customStart, customEnd);
  const assignedCount = periodMissions.filter((mission) => mission.creatorId === currentUser.id).length;
  const snapshot = buildLeaderSnapshot(users, periodMissions, groups, currentUser.id, getAnalyticsPeriodLabel(selectedPeriod), missions);
  const students = users.filter((user) => user.role === 'CHILD');
  const pendingReviews = periodMissions.filter(
    (mission) => mission.creatorId === currentUser.id && mission.status === 'REVIEWING'
  );
  const attentionStudents = snapshot.students
    .filter((student) => ['COUNSELING', 'UNSUBMITTED'].includes(student.status))
    .sort((a, b) => b.missed - a.missed);
  const attentionClass = [...snapshot.classes].filter((row) => row.missed > 0).sort((a, b) => b.missed - a.missed)[0];

  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title="홈" showBack={false} showPoints={false} />
      <main className="content-area space-y-4 px-4 py-4">
        <section className="border-b border-[#E7E1D9] px-1 pb-4 pt-1">
          <p className="text-sm text-[#687282]">{currentUser.name} 선생님,</p>
          <h1 className="mt-1 text-[21px] font-bold tracking-[-0.03em] text-[#14233B]">오늘 확인할 내용을 정리했습니다.</h1>
          <p className="mt-5 text-xs font-semibold text-[#687282]">오늘 확인할 항목</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['검토대기', `${snapshot.pendingReviewCount}건`, 'text-amber-300'],
              ['미제출', `${snapshot.missedCount}건`, 'text-red-300'],
              ['기간 수행률', assignedCount === 0 ? '—' : `${snapshot.weeklyRate}%`, 'text-emerald-300'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left">
                <p className="text-xl font-bold text-[#14233B]">{value}</p>
                <p className="mt-1 text-[9px] font-medium text-[#687282]">{label}</p>
              </div>
            ))}
          </div>
          {attentionClass && assignedCount > 0 && (
            <button onClick={() => navigate(`/students?class=${attentionClass.id}&status=missing&sort=missing`)} className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-xl bg-[#F8EAE8] px-3 py-2 text-left">
              <AlertTriangle size={14} className="text-[#B35F5A]" />
              <span className="flex-1 text-[11px] font-semibold text-[#7D4743]">{attentionClass.name} 미제출 {attentionClass.missed}건 · {memberLabel} 확인</span>
              <ChevronRight size={14} className="text-[#B35F5A]" />
            </button>
          )}
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-black text-slate-500">빠른 액션</h2>
          <div className="grid grid-cols-2 gap-2">
          {[
            { label: '미션 만들기', icon: Plus, to: '/missions/create', color: 'bg-purple-600' },
            { label: `${memberLabel} 관리`, icon: UserPlus, to: '/students', color: 'bg-emerald-600' },
          ].map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className="rounded-xl border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left text-[#14233B] active:scale-[0.98]"
            >
              <Icon size={19} />
              <p className="mt-2 text-xs font-black">{label}</p>
            </button>
          ))}
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-black text-slate-800">검토 대기 제출물</h2>
            <button type="button" onClick={() => navigate('/missions?tab=pending')} className="flex items-center text-xs font-black text-purple-600">
              전체 보기 <ChevronRight size={14} />
            </button>
          </div>
          {pendingReviews.slice(0, 3).map((mission) => {
            const student = students.find((user) => user.id === mission.assigneeId);
            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => navigate('/missions?tab=pending')}
                className="premium-row flex min-h-16 w-full items-center gap-3 p-3 text-left"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                  <ClipboardCheck size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-800">{mission.title}</span>
                  <span className="text-xs text-slate-400">{student?.name ?? '실천자'}</span>
                </span>
                <ChevronRight size={15} className="text-slate-300" />
              </button>
            );
          })}
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-black text-slate-800">오늘 확인할 {memberLabel}</h2>
            <button onClick={() => navigate('/students')} className="flex items-center text-xs font-black text-purple-600">{memberLabel} 관리 <ChevronRight size={14} /></button>
          </div>
          {attentionStudents.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-700">현재 집중 관리가 필요한 {memberLabel}이 없습니다.</div>
          ) : attentionStudents.slice(0, 3).map((row) => {
            const needsSubmission = row.missed > 0;
            return (
              <button key={row.user.id} onClick={() => navigate(`/students/${row.user.id}`)} className="premium-row flex min-h-16 w-full items-center gap-3 p-3 text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E9EDF2] text-sm font-bold text-[#14233B]">{row.user.name.slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-800">{row.user.name} · {row.className}</span>
                  <span className="text-[11px] font-bold text-slate-400">{needsSubmission ? `미제출 ${row.missed}건 · 최근 활동 확인` : '최근 제출 활동 확인 필요'}</span>
                </span>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black ${needsSubmission ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{needsSubmission ? '미제출' : '활동 확인'}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            );
          })}
        </section>

        <section className="rounded-xl border border-[#D8D0C5] bg-[#F3EFE9] p-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={17} className="text-purple-600" />
            <h2 className="text-sm font-bold text-[#14233B]">운영 메모</h2>
          </div>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{assignedCount === 0 ? '선택한 기간에 등록된 미션이 없습니다. 새 미션이 등록되면 진행 현황이 표시됩니다.' : snapshot.missedCount > 0 ? `미제출 ${snapshot.missedCount}건이 있습니다. ${memberLabel} 목록에서 오래된 활동부터 확인해 주세요.` : snapshot.pendingReviewCount > 0 ? `검토를 기다리는 제출물 ${snapshot.pendingReviewCount}건이 있습니다.` : '현재 우선 확인이 필요한 미제출 항목이 없습니다.'}</p>
          <button onClick={() => navigate('/students')} className="mt-3 flex items-center gap-1 text-xs font-black text-purple-600">{memberLabel} 활동 보기 <ChevronRight size={13} /></button>
        </section>
      </main>
    </div>
  );
}

export default function HomePage() {
  const { currentUser, viewMode } = useAuthStore();

  if (!currentUser) return null;
  return viewMode === 'FACILITATOR' ? <FacilitatorHome /> : <PerformerHome />;
}
