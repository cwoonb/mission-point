import { CalendarClock, Check, ChevronRight, Circle, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../layout/Header';
import EmptyState from '../ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useMembershipStore } from '../../store/membershipStore';
import { useMissionStore } from '../../store/missionStore';
import { missionInOrganization } from '../../utils/membershipScope';

const dayKey = (value: string | Date) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function PersonalTodoHome() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeOrganizationId = useMembershipStore((state) => state.memberships.find((membership) => membership.id === state.activeMembershipId)?.organizationId);
  const missions = useMissionStore((state) => state.missions);
  const updateStatus = useMissionStore((state) => state.updateStatus);
  if (!currentUser) return null;
  const mine = missions.filter((mission) => mission.assigneeId === currentUser.id && missionInOrganization(mission, activeOrganizationId));
  const open = mine.filter((mission) => mission.status !== 'SUCCESS').sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  const completed = mine.filter((mission) => mission.status === 'SUCCESS');
  const today = dayKey(new Date());
  const dueToday = open.filter((mission) => dayKey(mission.endDate) === today);

  return <div className="page-container bg-[#F8F5F0]">
    <Header title="홈" showBack={false} showPoints={false}/>
    <main className="content-area space-y-6 px-4 py-5">
      <section>
        <p className="text-sm font-semibold text-[#14233B]">{currentUser.name}님,</p>
        <h1 className="mt-1 text-[20px] font-bold tracking-[-0.03em] text-[#14233B]">오늘 할 일을 확인해 보세요.</h1>
      </section>
      <section className="grid grid-cols-3 gap-2">
        {[['남은 TODO', open.length], ['오늘 마감', dueToday.length], ['완료', completed.length]].map(([label, value]) =>
          <button type="button" key={label} onClick={() => navigate(label === '완료' ? '/missions?tab=completed' : '/missions')} className="min-h-[82px] rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left">
            <strong className="text-xl text-[#14233B]">{value}</strong><span className="mt-2 block text-[10px] font-semibold text-[#687282]">{label}</span>
          </button>)}
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">우선 할 일</h2><button type="button" onClick={() => navigate('/missions')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#687282]">전체 보기<ChevronRight size={14}/></button></div>
        {open.length === 0 ? <EmptyState title="남은 할 일이 없습니다." description="새 TODO를 작성해 오늘 할 일을 정리해 보세요." actionLabel="TODO 작성" onAction={() => navigate('/missions/create')}/> :
          <div className="divide-y divide-[#ECE7E0] overflow-hidden rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC]">{open.slice(0, 5).map((mission) =>
            <div key={mission.id} className="flex min-h-[66px] items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => updateStatus(mission.id, 'SUCCESS')} aria-label={`${mission.title} 완료`} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#9AA1AA]"><Circle size={22}/></button>
              <button type="button" onClick={() => navigate(`/missions/${mission.id}`)} className="min-w-0 flex-1 py-2 text-left"><strong className="block truncate text-sm text-[#27313F]">{mission.title}</strong><span className={`mt-1 flex items-center gap-1 text-[10px] ${dayKey(mission.endDate) <= today ? 'font-semibold text-[#A65F59]' : 'text-[#8B929C]'}`}><CalendarClock size={11}/>{dayKey(mission.endDate) === today ? '오늘까지' : new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(new Date(mission.endDate))}</span></button>
              <ChevronRight size={14} className="text-[#B5B7BC]"/>
            </div>)}</div>}
      </section>
      {completed.length > 0 && <p className="flex items-center justify-center gap-1.5 text-xs text-[#52775E]"><Check size={14}/>지금까지 {completed.length}개를 완료했어요.</p>}
      <button type="button" onClick={() => navigate('/missions/create')} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white"><Plus size={17}/>새 TODO 작성</button>
    </main>
  </div>;
}
