import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, ChevronRight, Clock3, MessageCircle, Target } from 'lucide-react';
import EmptyState from '../ui/EmptyState';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useMissionStore } from '../../store/missionStore';
import type { Mission } from '../../types';
import { formatDate } from '../../utils/helpers';
import { useMembershipStore } from '../../store/membershipStore';
import { missionInOrganization } from '../../utils/membershipScope';

const dayKey = (value: string | Date) => { const date = new Date(value); return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`; };
const statusText = (mission: Mission, attempts: number) => {
  if (mission.status === 'SUCCESS') return attempts > 1 ? '승인 완료' : '완료';
  if (mission.status === 'REJECTED') return '수정 요청';
  if (mission.status === 'REVIEWING') return attempts > 1 ? '수정 제출 완료' : '승인 대기';
  if (mission.status === 'PENDING' || new Date(mission.startDate) > new Date()) return '시작 전';
  if (dayKey(mission.endDate) === dayKey(new Date())) return '오늘 마감';
  return '진행 중';
};

function MissionRow({ mission, attempts, onOpen }: { mission: Mission; attempts: number; onOpen: () => void }) {
  const status = statusText(mission, attempts);
  return <button type="button" onClick={onOpen} className="flex min-h-[68px] w-full items-center gap-3 rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] px-3 py-2.5 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E9EDF2] text-[#14233B]"><Target size={18}/></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#27313F]">{mission.title}</strong><span className="mt-1 block text-[11px] text-[#7D8490]">{status} · {formatDate(mission.endDate)}까지</span></span><ChevronRight size={15} className="text-[#B5B7BC]"/></button>;
}

export default function PerformerHome() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const activeOrganizationId=useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId)?.organizationId);
  if (!currentUser) return null;
  const mine = missions.filter((mission) => mission.assigneeId === currentUser.id&&missionInOrganization(mission,activeOrganizationId));
  const submissionsFor = (missionId: string) => submissions.filter((submission) => submission.missionId === missionId);
  const actionable = mine.filter((mission) => ['PENDING','IN_PROGRESS'].includes(mission.status));
  const dueToday = actionable.filter((mission) => dayKey(mission.endDate) === dayKey(new Date()));
  const rejected = mine.filter((mission) => mission.status === 'REJECTED');
  const feedback = reviewLogs.filter((log) => mine.some((mission) => mission.id === log.missionId) && !!(log.action === 'REJECTED' ? log.reason : log.publicFeedback));
  const completed = mine.filter((mission) => mission.status === 'SUCCESS').sort((a,b)=>new Date(b.endDate).getTime()-new Date(a.endDate).getTime());
  const groupName = groups.find((group) => group.id === currentUser.groupId)?.name ?? '소속 없음';
  const priority=[...rejected,...dueToday,...actionable.filter((mission)=>!dueToday.includes(mission))];
  const counts = [{label:'해야 할 미션',value:actionable.length,icon:Target,to:'/missions?tab=todo'},{label:'오늘 마감',value:dueToday.length,icon:Clock3,to:'/missions?tab=todo'},{label:'선생님 피드백',value:Math.min(feedback.length,2),icon:MessageCircle,to:'/activity?view=feedback'}].filter((item)=>item.value>0);
  return <div className="page-container bg-[#F8F5F0]"><main className="content-area space-y-6 px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
    <header className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#B58A4A]">{groupName}</p><h1 className="mt-1 text-[22px] font-bold leading-8 text-[#14233B]">{currentUser.name} 학생,<br/>오늘 확인할 내용을 정리했어요.</h1></div><button type="button" aria-label="알림" className="flex h-11 w-11 items-center justify-center text-[#14233B]"><Bell size={20}/></button></header>
    {counts.length>0&&<section className="grid grid-cols-2 gap-2">{counts.map(({label,value,icon:Icon,to})=><button type="button" key={label} onClick={()=>navigate(to)} className="flex min-h-[82px] items-center gap-3 rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left"><Icon size={19} className="text-[#B58A4A]"/><span><strong className="text-xl text-[#14233B]">{value}</strong><span className="ml-1 text-[10px] text-[#687282]">건</span><span className="mt-1 block text-[11px] font-semibold text-[#687282]">{label}</span></span></button>)}</section>}
    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">우선 확인</h2><button type="button" onClick={()=>navigate('/missions?tab=todo')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-[#687282]">전체 보기<ChevronRight size={14}/></button></div><div className="space-y-2">{priority.slice(0,3).map((mission)=><MissionRow key={mission.id} mission={mission} attempts={submissionsFor(mission.id).length} onOpen={()=>navigate(`/missions/${mission.id}`)}/>)}</div>{priority.length===0&&<EmptyState title="현재 진행할 미션이 없습니다." description="새로운 미션이 등록되면 여기에 표시됩니다."/>}</section>
    {feedback.length>0&&<section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-[#14233B]">선생님 피드백</h2><button type="button" onClick={()=>navigate('/activity?view=feedback')} className="min-h-11 text-xs font-bold text-[#687282]">모두 보기</button></div>{feedback.slice(0,2).map((log)=>{const mission=mine.find((item)=>item.id===log.missionId);return <button type="button" key={log.id} onClick={()=>mission&&navigate(`/missions/${mission.id}`)} className="mb-2 w-full rounded-[12px] border border-[#D8D0C5] bg-[#F3EFE9] p-4 text-left"><strong className="text-sm text-[#14233B]">{mission?.title}</strong><p className="mt-2 line-clamp-2 text-xs leading-5 text-[#687282]">{log.action==='REJECTED'?log.reason:log.publicFeedback}</p></button>;})}</section>}
    {completed.length>0&&<section><h2 className="mb-3 text-sm font-bold text-[#14233B]">최근 완료</h2>{completed.slice(0,2).map((mission)=><button type="button" key={mission.id} onClick={()=>navigate(`/missions/${mission.id}`)} className="mb-2 flex min-h-14 w-full items-center gap-3 rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] px-3 text-left"><CheckCircle2 size={18} className="text-[#4F8A68]"/><span className="flex-1 truncate text-sm font-semibold text-[#27313F]">{mission.title}</span><ChevronRight size={14} className="text-[#B5B7BC]"/></button>)}</section>}
  </main></div>;
}
