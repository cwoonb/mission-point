import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, ImagePlus, Send, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import { useAuthStore } from '../store/authStore';
import { useMissionStore } from '../store/missionStore';
import { getStudentDemoImage } from '../data/studentDemo';

export default function MissionSubmitPage() {
  const { id } = useParams<{id:string}>();
  const navigate = useNavigate();
  const { currentUser, isDemoMode } = useAuthStore();
  const { getMission, getLatestSubmission, getReviewLogs, submitMission } = useMissionStore();
  const mission = id ? getMission(id) : undefined;
  const [message,setMessage]=useState('');
  const [image,setImage]=useState<string|null>(null);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [complete,setComplete]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  if(!mission||!currentUser)return <div className="page-container"><Header title="미션 제출" showBack/><main className="content-area p-4"><EmptyState title="미션을 찾을 수 없습니다."/></main></div>;
  const latest=getLatestSubmission(mission.id);
  const rejected=getReviewLogs(mission.id).find((log)=>log.action==='REJECTED');
  const isResubmission=mission.status==='REJECTED'||!!rejected;
  const needsImage=mission.submissionType==='IMAGE'||mission.submissionType==='BOTH';
  const needsText=mission.submissionType==='TEXT'||mission.submissionType==='BOTH';
  const valid=(!needsImage||!!image)&&(!needsText||!!message.trim());
  const fileChanged=(event:React.ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'&&setImage(reader.result);reader.readAsDataURL(file);};
  const submit=async()=>{if(!valid||submitting)return;setSubmitting(true);await submitMission(mission.id,currentUser.id,message.trim()||undefined,image||undefined);setConfirmOpen(false);setComplete(true);setSubmitting(false);};
  if(complete)return <div className="page-container bg-[#F8F5F0]"><main className="content-area flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center px-6 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#4F8A68] text-[#4F8A68]"><CheckCircle2 size={36}/></span><h1 className="mt-6 text-xl font-bold text-[#14233B]">{isResubmission?'수정 제출이 완료되었습니다.':'제출이 완료되었습니다.'}</h1><p className="mt-2 text-sm leading-6 text-[#687282]">선생님 확인을 기다리고 있습니다.<br/>{isResubmission?'수정 제출 완료 상태로 저장되었습니다.':'미션 상태가 승인 대기로 바뀌었습니다.'}</p><button type="button" onClick={()=>navigate(`/missions/${mission.id}`,{replace:true})} className="mt-8 min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white">미션 상태 확인</button><button type="button" onClick={()=>navigate('/missions',{replace:true})} className="mt-2 min-h-11 text-xs font-bold text-[#687282]">미션 목록으로</button></main></div>;
  return <div className="page-container bg-[#F8F5F0]"><Header title={mission.status==='REJECTED'?'수정 후 다시 제출':'미션 제출'} showBack showPoints={false}/><main className="content-area space-y-4 px-4 py-4">
    {rejected&&mission.status==='REJECTED'&&<section className="rounded-[12px] border border-[#E4B8B4] bg-[#FFF7F6] p-4"><h2 className="text-sm font-bold text-[#9B4E49]">선생님 수정 요청</h2><p className="mt-2 text-sm leading-6 text-[#714B48]">{rejected.reason}</p></section>}
    <section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><h1 className="text-lg font-bold text-[#14233B]">{mission.title}</h1><p className="mt-2 text-sm leading-6 text-[#687282]">{mission.description}</p>{latest&&mission.status==='REJECTED'&&<p className="mt-3 text-[11px] font-semibold text-[#B58A4A]">이전 제출물을 참고해 수정해 주세요.</p>}</section>
    {needsImage&&<section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><label className="text-sm font-bold text-[#14233B]">사진 첨부</label><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={fileChanged}/>{image?<div className="relative mt-3"><img src={image} alt="제출 이미지 미리보기" className="max-h-72 w-full rounded-[12px] bg-[#F1EDE7] object-contain"/><button type="button" onClick={()=>setImage(null)} aria-label="첨부 이미지 삭제" className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#14233B]/75 text-white"><X size={16}/></button></div>:<div className="mt-3 grid gap-2"><button type="button" onClick={()=>fileRef.current?.click()} className="flex min-h-20 w-full items-center justify-center gap-2 rounded-[12px] border border-dashed border-[#C8C1B8] text-sm font-semibold text-[#687282]"><Camera size={20}/>사진 선택</button>{isDemoMode&&<button type="button" onClick={()=>setImage(getStudentDemoImage(`${mission.title} 데모 제출`))} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#F1E7D6] text-xs font-bold text-[#8A672F]"><ImagePlus size={16}/>데모 이미지 첨부</button>}</div>}</section>}
    {needsText&&<section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><label htmlFor="student-comment" className="text-sm font-bold text-[#14233B]">학생 코멘트</label><textarea id="student-comment" value={message} onChange={(event)=>setMessage(event.target.value)} maxLength={500} rows={5} placeholder="한 일과 느낀 점을 적어주세요." className="mt-3 w-full resize-none rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] p-3 text-sm leading-6 outline-none focus:border-[#14233B]"/><p className="mt-1 text-right text-[10px] text-[#9A9FA7]">{message.length}/500</p></section>}
    <button type="button" onClick={()=>setConfirmOpen(true)} disabled={!valid} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:bg-[#A7ABB2]"><Send size={17}/>제출 내용 확인</button>
  </main><Modal isOpen={confirmOpen} onClose={()=>setConfirmOpen(false)} title="제출하시겠어요?"><p className="text-sm leading-6 text-[#687282]">제출 후 상태가 승인 대기로 바뀝니다. 수정 요청을 받은 미션은 재제출 기록으로 저장됩니다.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setConfirmOpen(false)} className="min-h-12 rounded-[10px] border border-[#D8D0C5] text-sm font-bold text-[#687282]">취소</button><button type="button" onClick={submit} disabled={submitting} className="min-h-12 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50">{submitting?'제출 중':'제출'}</button></div></Modal></div>;
}
