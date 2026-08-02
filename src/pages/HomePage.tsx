import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Circle, ClipboardCheck, FileText, Plus } from 'lucide-react';
import PerformerHome from '../components/home/PerformerHome';
import GuardianHomePage from './guardian/GuardianHomePage';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { useGroupStore } from '../store/groupStore';
import { calculateHomeworkStats, groupMissionsByHomework } from '../utils/missionStats';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';
import { missionInOrganization } from '../utils/membershipScope';

function FacilitatorHome() {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const { missions, submissions, updateStatus } = useMissionStore();
  const groups = useGroupStore((state) => state.groups);
  const activeOrganizationId=useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId)?.organizationId);
  if (!currentUser) return null;

  const created = missions.filter((mission) => mission.creatorId === currentUser.id&&missionInOrganization(mission,activeOrganizationId));
  const selfTasks = created.filter((mission) => mission.assigneeId === currentUser.id).sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const openSelfTasks = selfTasks.filter((mission) => mission.status !== 'SUCCESS');
  const studentMissions = created.filter((mission) => mission.assigneeId !== currentUser.id);
  const pending = created.filter((mission) => mission.status === 'REVIEWING');
  const missingStudentIds = new Set(created.filter((mission) => ['EXPIRED', 'FAILED'].includes(mission.status)).map((mission) => mission.assigneeId));
  const today = new Date();
  const dueToday = created.filter((mission) => {
    const date = new Date(mission.endDate);
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate() && !['SUCCESS', 'EXPIRED', 'FAILED'].includes(mission.status);
  });
  const recentHomework = groupMissionsByHomework(studentMissions).sort((a, b) => new Date(b[0].createdAt).getTime() - new Date(a[0].createdAt).getTime()).slice(0, 3);
  const recentActivity = submissions.filter((submission) => studentMissions.some((mission) => mission.id === submission.missionId)).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).slice(0, 3);
  const missionFor = (id: string) => created.find((mission) => mission.id === id);
  const studentFor = (id: string) => users.find((user) => user.id === id);
  const groupFor = (id?: string) => groups.find((group) => group.id === id)?.name ?? '반 미지정';

  return (
    <div className="page-container bg-[#F8F5F0]">
      <Header title="홈" showBack={false} showPoints={false}/>
      <main className="content-area space-y-6 px-4 py-5">
        <section>
          <p className="text-sm font-semibold text-[#14233B]">{currentUser.name} 선생님,</p>
          <h1 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#14233B]">오늘 확인할 내용을 정리했습니다.</h1>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-bold text-[#14233B]">내 할 일</h2><p className="mt-1 text-[10px] text-[#8B929C]">학생 관리와 리포팅 업무를 잊지 않게 기록하세요.</p></div><button type="button" onClick={() => navigate('/missions/create?target=self')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#14233B]"><Plus size={14}/>추가</button></div>
          {openSelfTasks.length === 0 ? <div className="rounded-[12px] border border-dashed border-[#D8D0C5] bg-[#FFFDFC] px-4 py-5 text-center"><p className="text-xs text-[#687282]">등록한 내 할 일이 없습니다.</p><button type="button" onClick={() => navigate('/missions/create?target=self')} className="mt-2 min-h-10 px-3 text-xs font-bold text-[#14233B]">내 할 일 작성하기</button></div> : <div className="divide-y divide-[#ECE7E0] overflow-hidden rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC]">{openSelfTasks.slice(0, 4).map((mission) => <div key={mission.id} className="flex min-h-[62px] items-center gap-2 px-3 py-2"><button type="button" onClick={() => updateStatus(mission.id, 'SUCCESS')} aria-label={`${mission.title} 완료`} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#9299A3]"><Circle size={21}/></button><button type="button" onClick={() => navigate(`/missions/${mission.id}`)} className="min-w-0 flex-1 py-2 text-left"><strong className="block truncate text-sm text-[#27313F]">{mission.title}</strong><span className="mt-1 block text-[10px] text-[#8B929C]">{formatDate(mission.endDate)}까지</span></button><ChevronRight size={14} className="text-[#B5B7BC]"/></div>)}</div>}
          {selfTasks.some((mission) => mission.status === 'SUCCESS') && <button type="button" onClick={() => navigate('/missions?tab=self')} className="mt-2 flex min-h-10 w-full items-center justify-center gap-1 text-[11px] font-semibold text-[#52775E]"><CheckCircle2 size={13}/>완료한 내 할 일 보기</button>}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold text-[#687282]">오늘 확인할 항목</h2>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '승인 대기', value: pending.length, suffix: '건', onClick: () => navigate('/missions?tab=pending') },
              { label: '미제출 확인', value: missingStudentIds.size, suffix: '명', onClick: () => navigate('/students?status=missing&sort=missing') },
              { label: '오늘 마감', value: dueToday.length, suffix: '건', onClick: () => navigate('/missions?tab=due') },
            ].map((item) => <button type="button" key={item.label} onClick={item.onClick} className="min-h-[84px] rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left shadow-[0_2px_10px_rgba(20,35,59,.035)]"><strong className="text-xl text-[#14233B]">{item.value}</strong><span className="ml-0.5 text-[10px] font-semibold text-[#687282]">{item.suffix}</span><span className="mt-2 block text-[10px] font-semibold text-[#687282]">{item.label}</span></button>)}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">최근 미션</h2><button type="button" onClick={() => navigate('/missions')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#687282]">더보기<ChevronRight size={14}/></button></div>
          {recentHomework.length === 0 ? <EmptyState title="등록된 미션이 없습니다." actionLabel="첫 미션 만들기" onAction={() => navigate('/missions/create')}/> : <div className="divide-y divide-[#ECE7E0] overflow-hidden rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC]">{recentHomework.map((items) => {
            const mission = items[0]; const stats = calculateHomeworkStats(items); const student = studentFor(mission.assigneeId);
            return <button type="button" key={mission.id} onClick={() => navigate(`/missions/homework/${mission.id}`)} className="flex min-h-[66px] w-full items-center gap-3 px-3 py-2 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#F1E7D6] text-[#8A672F]"><FileText size={17}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#27313F]">{mission.title}</strong><span className="mt-1 block text-[10px] text-[#8B929C]">{groupFor(student?.groupId)} · 제출 {stats.completed + stats.pending}/{stats.total}</span></span>{stats.pending > 0 && <span className="rounded-full bg-[#F1E7D6] px-2 py-1 text-[9px] font-bold text-[#8A672F]">승인 {stats.pending}</span>}<ChevronRight size={14} className="text-[#B5B7BC]"/></button>;
          })}</div>}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">최근 활동</h2><button type="button" onClick={() => navigate('/students')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#687282]">더보기<ChevronRight size={14}/></button></div>
          {recentActivity.length === 0 ? <EmptyState title="최근 제출 활동이 없습니다."/> : <div className="divide-y divide-[#ECE7E0] rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC]">{recentActivity.map((submission) => { const mission = missionFor(submission.missionId); const student = studentFor(submission.userId); return <button type="button" key={submission.id} onClick={() => mission?.status === 'REVIEWING' ? navigate(`/missions/${mission.id}/review`) : navigate(`/students/${submission.userId}`)} className="flex min-h-[60px] w-full items-center gap-3 px-3 py-2 text-left"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9EDF2] text-xs font-bold text-[#14233B]">{student?.name.slice(0, 1) ?? <ClipboardCheck size={15}/>}</span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-[#27313F]">{student?.name ?? '학생'} · {mission?.title ?? '미션 제출'}</strong><span className="mt-1 block text-[10px] text-[#8B929C]">{formatDateTime(submission.submittedAt)}</span></span><ChevronRight size={14} className="text-[#B5B7BC]"/></button>; })}</div>}
        </section>

        <button type="button" onClick={() => navigate('/missions/create')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white"><Plus size={17}/>새 미션 만들기</button>
      </main>
    </div>
  );
}

export default function HomePage() {
  const currentUser = useAuthStore((state)=>state.currentUser);
  const active = useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId));
  if (!currentUser) return null;
  if (active?.role === 'GUARDIAN') return <GuardianHomePage/>;
  return active?.role === 'STUDENT' ? <PerformerHome/> : <FacilitatorHome/>;
}
