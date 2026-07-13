import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Lightbulb, Plus, UserPlus } from 'lucide-react';
import PerformerHome from '../components/home/PerformerHome';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useGroupStore } from '../store/groupStore';
import { buildLeaderSnapshot } from '../utils/leaderAnalytics';
import { statusConfig } from '../utils/studentStats';
import {
  filterMissionsByAnalyticsPeriod,
  getAnalyticsPeriodLabel,
  useAnalyticsPeriodStore,
} from '../store/analyticsPeriodStore';

function FacilitatorHome() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  const { selectedPeriod, customStart, customEnd } = useAnalyticsPeriodStore();

  if (!currentUser) return null;

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
    <div className="page-container bg-slate-50">
      <Header title="리더 홈" showBack={false} showPoints={false} />
      <main className="content-area space-y-4 px-4 py-4">
        <section className="rounded-3xl bg-slate-900 p-5 text-white shadow-lg">
          <p className="text-xs font-black text-white/50">오늘의 관리 요약</p>
          <h1 className="mt-1 text-xl font-black">{currentUser.name}님, 오늘 관리 현황이에요</h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ['검토대기', `${snapshot.pendingReviewCount}건`, 'text-amber-300'],
              ['미제출', `${snapshot.missedCount}건`, 'text-red-300'],
              ['기간 수행률', assignedCount === 0 ? '—' : `${snapshot.weeklyRate}%`, 'text-emerald-300'],
            ].map(([label, value, color]) => (
              <div key={label} className="rounded-2xl bg-white/10 p-3 text-center">
                <p className={`text-xl font-black ${color}`}>{value}</p>
                <p className="mt-1 text-[9px] font-bold text-white/50">{label}</p>
              </div>
            ))}
          </div>
          {attentionClass && assignedCount > 0 && (
            <button onClick={() => navigate(`/students?class=${attentionClass.id}&status=missing&sort=missing`)} className="mt-3 flex min-h-11 w-full items-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-left">
              <AlertTriangle size={14} className="text-red-300" />
              <span className="flex-1 text-[11px] font-bold text-white/80">{attentionClass.name} 미제출 {attentionClass.missed}건 · 학생 확인</span>
              <ChevronRight size={14} className="text-white/40" />
            </button>
          )}
        </section>

        <section>
          <h2 className="mb-2 px-1 text-xs font-black text-slate-500">빠른 액션</h2>
          <div className="grid grid-cols-2 gap-2">
          {[
            { label: '미션 만들기', icon: Plus, to: '/missions/create', color: 'bg-purple-600' },
            { label: '학생 초대', icon: UserPlus, to: '/students', color: 'bg-emerald-600' },
          ].map(({ label, icon: Icon, to, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate(to)}
              className={`rounded-2xl ${color} p-3 text-left text-white shadow-md active:scale-95`}
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
                className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm"
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
            <h2 className="font-black text-slate-800">오늘 확인할 학생</h2>
            <button onClick={() => navigate('/students')} className="flex items-center text-xs font-black text-purple-600">학생 관리 <ChevronRight size={14} /></button>
          </div>
          {attentionStudents.length === 0 ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-700">현재 집중 관리가 필요한 학생이 없습니다.</div>
          ) : attentionStudents.slice(0, 3).map((row) => {
            const config = statusConfig[row.status];
            return (
              <button key={row.user.id} onClick={() => navigate(`/students/${row.user.id}`)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm">
                <span className="text-2xl">{row.user.avatar}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-800">{row.user.name} · {row.className}</span>
                  <span className="text-[11px] font-bold text-slate-400">미제출 {row.missed}건 · 최근 활동 확인</span>
                </span>
                <span className={`rounded-full px-2 py-1 text-[9px] font-black ${config.bg} ${config.color}`}>{config.label}</span>
                <ChevronRight size={14} className="text-slate-300" />
              </button>
            );
          })}
        </section>

        <section className="rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-4">
          <div className="flex items-center gap-2">
            <Lightbulb size={17} className="text-purple-600" />
            <h2 className="text-sm font-black text-purple-800">활동 요약</h2>
          </div>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-600">{assignedCount === 0 ? '선택한 기간에 등록된 미션이 없습니다. 새 미션이 등록되면 진행 현황이 표시됩니다.' : snapshot.insights[0]}</p>
          <button onClick={() => navigate('/students')} className="mt-3 flex items-center gap-1 text-xs font-black text-purple-600">학생 활동 보기 <ChevronRight size={13} /></button>
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
