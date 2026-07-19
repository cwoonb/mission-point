import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, FileText, Image as ImageIcon, MessageCircle, RefreshCw, UserRound } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import { formatDate, formatDateTime, submissionTypeLabel } from '../utils/helpers';
import { useMembershipStore } from '../store/membershipStore';
import { missionInOrganization } from '../utils/membershipScope';

export default function MissionDetailPage() {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const active = useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId));
  const groups = useGroupStore((state)=>state.groups);
  const { getMission, getLatestSubmission, getReviewLogs, submissions } = useMissionStore();
  const mission = id ? getMission(id) : undefined;
  if (!mission || !currentUser) return <div className="page-container"><Header title="미션 상세" showBack/><main className="content-area p-4"><EmptyState title="미션을 찾을 수 없습니다."/></main></div>;
  if(!missionInOrganization(mission,active?.organizationId))return <Navigate to="/" replace/>;
  if(active?.role==='STUDENT'&&mission.assigneeId!==currentUser.id)return <Navigate to="/" replace/>;
  const performer = active?.role === 'STUDENT' && mission.assigneeId === currentUser.id;
  const assignee = users.find((user)=>user.id===mission.assigneeId);
  const teacher = users.find((user)=>user.id===mission.creatorId);
  const groupName = groups.find((group)=>group.id===assignee?.groupId)?.name ?? '소속 없음';
  const latest = getLatestSubmission(mission.id);
  const allSubmissions = submissions.filter((submission)=>submission.missionId===mission.id).sort((a,b)=>new Date(b.submittedAt).getTime()-new Date(a.submittedAt).getTime());
  const logs = getReviewLogs(mission.id);
  const rejected = logs.find((log)=>log.action==='REJECTED');
  const approved = logs.find((log)=>log.action==='APPROVED');
  const canSubmit = performer && ['IN_PROGRESS','REJECTED'].includes(mission.status);
  const attempts = allSubmissions.length;
  const today = new Date(); const end = new Date(mission.endDate);
  const sameDay = today.getFullYear()===end.getFullYear()&&today.getMonth()===end.getMonth()&&today.getDate()===end.getDate();
  const status = mission.status==='SUCCESS'?'승인 완료':mission.status==='REJECTED'?'수정 요청':mission.status==='REVIEWING'?(attempts>1?'수정 제출 완료':'승인 대기'):mission.status==='PENDING'||new Date(mission.startDate)>today?'시작 전':sameDay?'오늘 마감':'진행 중';
  return <div className="page-container bg-[#F8F5F0]"><Header title="미션 상세" showBack showPoints={false}/><main className="content-area space-y-4 px-4 py-4">
    <section className="rounded-[16px] border border-[#E7E1D9] bg-[#FFFDFC] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#B58A4A]">{groupName}</p><h1 className="mt-1 text-xl font-bold text-[#14233B]">{mission.title}</h1></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${mission.status==='REJECTED'?'bg-[#F7ECEA] text-[#A65F59]':mission.status==='SUCCESS'?'bg-[#EAF2EC] text-[#52775E]':mission.status==='REVIEWING'?'bg-[#F8EFE3] text-[#A66D32]':'bg-[#EAF0F6] text-[#536D8B]'}`}>{status}</span></div><p className="mt-4 text-sm leading-6 text-[#53606F]">{mission.description}</p><div className="mt-5 grid gap-2 text-xs text-[#687282]"><p className="flex items-center gap-2"><Calendar size={15}/>{formatDate(mission.startDate)} ~ {formatDate(mission.endDate)}</p><p className="flex items-center gap-2"><FileText size={15}/>{submissionTypeLabel[mission.submissionType]}</p><p className="flex items-center gap-2"><UserRound size={15}/>{teacher?.name ?? '선생님'}</p></div></section>

    {mission.status==='REJECTED'&&rejected&&<section className="rounded-[14px] border border-[#E4B8B4] bg-[#FFF7F6] p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-[#9B4E49]"><RefreshCw size={17}/>선생님 수정 요청</h2><p className="mt-3 text-sm leading-6 text-[#714B48]">{rejected.reason}</p><p className="mt-2 text-[11px] text-[#9B7774]">{formatDateTime(rejected.createdAt)}</p></section>}
    {mission.status==='REVIEWING'&&<section className="rounded-[14px] border border-[#E5D0AD] bg-[#FFF9EF] p-4 text-center"><h2 className="font-bold text-[#8A672F]">{attempts>1?'수정 제출 완료':'제출 완료'}</h2><p className="mt-1 text-xs text-[#9A7540]">선생님 확인을 기다리고 있습니다.</p></section>}
    {mission.status==='SUCCESS'&&<section className="rounded-[14px] border border-[#CFE0D5] bg-[#F1F7F3] p-4"><h2 className="flex items-center gap-2 text-sm font-bold text-[#315E43]"><CheckCircle2 size={17}/>승인 완료</h2>{approved?.reason&&<p className="mt-3 text-sm leading-6 text-[#456650]">{approved.reason}</p>}</section>}

    {latest&&<section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><h2 className="text-sm font-bold text-[#14233B]">{mission.status==='REJECTED'?'이전 제출물':'최근 제출물'}</h2>{(latest.imageUrls?.length||latest.imageUrl)?<div className="mt-3 grid grid-cols-3 gap-2">{(latest.imageUrls?.length?latest.imageUrls:[latest.imageUrl!]).map((image,index)=><img key={`${image.slice(0,20)}-${index}`} src={image} alt={`제출 이미지 ${index+1}`} className="aspect-square w-full rounded-[10px] bg-[#F1EDE7] object-cover"/>)}</div>:<div className="mt-3 flex min-h-24 items-center justify-center rounded-[12px] bg-[#F5F2ED] text-[#9A9FA7]"><ImageIcon size={22}/></div>}{latest.message&&<><h3 className="mt-4 text-xs font-bold text-[#14233B]">내가 작성한 코멘트</h3><p className="mt-2 rounded-[10px] bg-[#F5F2ED] p-3 text-sm leading-6 text-[#53606F]">{latest.message}</p></>}<p className="mt-2 text-[11px] text-[#8B929C]">{formatDateTime(latest.submittedAt)} · {latest.attemptNumber}차 제출</p></section>}

    {logs.length>0&&<section><h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#14233B]"><MessageCircle size={17}/>선생님 피드백</h2><div className="space-y-2">{logs.filter((log)=>log.reason).map((log)=><article key={log.id} className="rounded-[12px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><div className="flex justify-between gap-2"><strong className={`text-xs ${log.action==='REJECTED'?'text-[#A65F59]':'text-[#4F8A68]'}`}>{log.action==='REJECTED'?'수정 요청':'승인'}</strong><time className="text-[10px] text-[#9A9FA7]">{formatDateTime(log.createdAt)}</time></div><p className="mt-2 text-sm leading-6 text-[#53606F]">{log.reason}</p></article>)}</div></section>}
    {canSubmit&&<button type="button" onClick={()=>navigate(`/missions/${mission.id}/submit`)} className="min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white">{mission.status==='REJECTED'?'다시 제출하기':'미션 제출하기'}</button>}
    {!performer&&mission.status==='REVIEWING'&&<button type="button" onClick={()=>navigate(`/missions/${mission.id}/review`)} className="min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white">제출물 검토하기</button>}
  </main></div>;
}
