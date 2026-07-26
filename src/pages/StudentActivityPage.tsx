import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChevronRight, MessageCircle, RefreshCw, Send } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import SegmentTabs from '../components/ui/SegmentTabs';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { formatDate, formatDateTime } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';
import { missionInOrganization } from '../utils/membershipScope';

type Event = { id:string; missionId:string; title:string; detail:string; at:string; tone:string; icon:typeof Send };

export default function StudentActivityPage(){
  const navigate=useNavigate();
  const [params,setParams]=useSearchParams();
  const currentUser=useAuthStore((state)=>state.currentUser);
  const {missions,submissions,reviewLogs}=useMissionStore();
  const activeOrganizationId=useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId)?.organizationId);
  if(!currentUser)return null;
  const mine=missions.filter((mission)=>mission.assigneeId===currentUser.id&&missionInOrganization(mission,activeOrganizationId));
  const ids=new Set(mine.map((mission)=>mission.id));
  const title=(missionId:string)=>mine.find((mission)=>mission.id===missionId)?.title??'미션';
  const events:Event[]=[
    ...submissions.filter((submission)=>ids.has(submission.missionId)).map((submission)=>({id:submission.id,missionId:submission.missionId,title:title(submission.missionId),detail:submission.attemptNumber>1?'재제출 완료':'제출 완료',at:submission.submittedAt,tone:submission.attemptNumber>1?'bg-[#F8EFE3] text-[#A66D32]':'bg-[#EAF0F6] text-[#536D8B]',icon:Send})),
    ...reviewLogs.filter((log)=>ids.has(log.missionId)).map((log)=>({id:log.id,missionId:log.missionId,title:title(log.missionId),detail:log.action==='REJECTED'?'선생님 수정 요청':'선생님 승인 완료',at:log.createdAt,tone:log.action==='REJECTED'?'bg-[#F7ECEA] text-[#A65F59]':'bg-[#EAF2EC] text-[#52775E]',icon:log.action==='REJECTED'?RefreshCw:CheckCircle2})),
  ].sort((a,b)=>new Date(b.at).getTime()-new Date(a.at).getTime());
  const feedback=reviewLogs.filter((log)=>ids.has(log.missionId)&&!!(log.action==='REJECTED'?log.reason:log.publicFeedback)).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  const view=params.get('view')==='feedback'?'feedback':'timeline';
  const tabs=[{key:'timeline' as const,label:'활동 기록',count:events.length},{key:'feedback' as const,label:'선생님 피드백',count:feedback.length}];
  return <div className="page-container bg-[#F8F5F0]"><Header title="내 활동" showBack={false} showPoints={false}/><main className="content-area px-4 pt-3"><SegmentTabs tabs={tabs} value={view} onChange={(value)=>{const next=new URLSearchParams(params);value==='feedback'?next.set('view','feedback'):next.delete('view');setParams(next,{replace:true});}} ariaLabel="활동 보기"/>
    {view==='timeline'?<section className="mt-5"><p className="mb-4 text-xs leading-5 text-[#687282]">제출부터 피드백, 수정, 승인까지 내 진행 과정을 확인할 수 있습니다.</p><div className="relative space-y-3 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-[#D8D0C5]">{events.map((event)=>{const Icon=event.icon;return <button type="button" key={event.id} onClick={()=>navigate(`/missions/${event.missionId}`)} className="relative flex min-h-[78px] w-full items-center gap-3 rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-3 text-left"><span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${event.tone}`}><Icon size={17}/></span><span className="min-w-0 flex-1"><time className="text-[10px] font-semibold text-[#B58A4A]">{formatDateTime(event.at)}</time><strong className="mt-1 block truncate text-sm text-[#27313F]">{event.title}</strong><span className="mt-1 block text-xs text-[#687282]">{event.detail}</span></span><ChevronRight size={14} className="text-[#B5B7BC]"/></button>;})}</div>{events.length===0&&<EmptyState title="아직 활동 기록이 없습니다."/>}</section>:<section className="mt-5 space-y-3">{feedback.map((log)=><button type="button" key={log.id} onClick={()=>navigate(`/missions/${log.missionId}`)} className="w-full rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-4 text-left"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] font-semibold text-[#B58A4A]">{formatDate(log.createdAt)}</p><h2 className="mt-1 text-sm font-bold text-[#14233B]">{title(log.missionId)}</h2></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${log.action==='REJECTED'?'bg-[#F7ECEA] text-[#A65F59]':'bg-[#EAF2EC] text-[#52775E]'}`}>{log.action==='REJECTED'?'수정 요청':'승인 완료'}</span></div><p className="mt-3 flex gap-2 text-sm leading-6 text-[#53606F]"><MessageCircle size={16} className="mt-1 shrink-0 text-[#B58A4A]"/>{log.action==='REJECTED'?log.reason:log.publicFeedback}</p></button>)}{feedback.length===0&&<EmptyState title="아직 받은 피드백이 없습니다."/>}</section>}
  </main></div>;
}
