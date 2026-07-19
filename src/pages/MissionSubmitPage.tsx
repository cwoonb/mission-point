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
  const [images,setImages]=useState<string[]>([]);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [complete,setComplete]=useState(false);
  const [error,setError]=useState('');
  const fileRef=useRef<HTMLInputElement>(null);
  if(!mission||!currentUser)return <div className="page-container"><Header title="미션 제출" showBack/><main className="content-area p-4"><EmptyState title="미션을 찾을 수 없습니다."/></main></div>;
  const latest=getLatestSubmission(mission.id);
  const rejected=getReviewLogs(mission.id).find((log)=>log.action==='REJECTED');
  const isResubmission=mission.status==='REJECTED'||!!rejected;
  const needsImage=mission.submissionType==='IMAGE'||mission.submissionType==='BOTH';
  const needsText=mission.submissionType==='TEXT'||mission.submissionType==='BOTH';
  const valid=(!needsImage||images.length>0)&&(!needsText||!!message.trim());
  const readFile=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'?resolve(reader.result):reject();reader.onerror=reject;reader.readAsDataURL(file);});
  const fileChanged=async(event:React.ChangeEvent<HTMLInputElement>)=>{const files=[...(event.target.files??[])].slice(0,5-images.length);if(!files.length)return;const next=await Promise.all(files.map(readFile));setImages(current=>[...current,...next].slice(0,5));event.target.value='';};
  const submit=async()=>{if(!valid||submitting)return;setSubmitting(true);setError('');try{await submitMission(mission.id,currentUser.id,message.trim()||undefined,images[0],images);setConfirmOpen(false);setComplete(true);}catch{setConfirmOpen(false);setError('제출하지 못했습니다. 작성 내용은 유지됩니다. 네트워크 연결을 확인하고 다시 시도해 주세요.');}finally{setSubmitting(false);}};
  if(complete)return <div className="page-container bg-[#F8F5F0]"><main className="content-area flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center px-6 text-center"><span className="flex h-20 w-20 items-center justify-center rounded-full border border-[#CBD3D9] text-[#14233B]"><CheckCircle2 size={36}/></span><h1 className="mt-6 text-xl font-bold text-[#14233B]">{isResubmission?'수정 제출이 완료되었습니다.':'제출이 완료되었습니다.'}</h1><p className="mt-2 text-sm leading-6 text-[#687282]">선생님 확인을 기다리고 있어요.</p><button type="button" onClick={()=>navigate('/missions',{replace:true})} className="mt-8 min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-bold text-white">미션 목록으로 돌아가기</button></main></div>;
  return <div className="page-container bg-[#F8F5F0]"><Header title={mission.status==='REJECTED'?'수정 후 다시 제출':'미션 제출'} showBack showPoints={false}/><main className="content-area space-y-4 px-4 py-4">
    {rejected&&mission.status==='REJECTED'&&<section className="rounded-[12px] border border-[#E4B8B4] bg-[#FFF7F6] p-4"><h2 className="text-sm font-bold text-[#9B4E49]">선생님 수정 요청</h2><p className="mt-2 text-sm leading-6 text-[#714B48]">{rejected.reason}</p></section>}
    <section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><h1 className="text-lg font-bold text-[#14233B]">{mission.title}</h1><p className="mt-2 text-sm leading-6 text-[#687282]">{mission.description}</p>{latest&&mission.status==='REJECTED'&&<p className="mt-3 text-[11px] font-semibold text-[#B58A4A]">이전 제출물을 참고해 수정해 주세요.</p>}</section>
    {needsImage&&<section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><div className="flex items-center justify-between"><label className="text-sm font-bold text-[#14233B]">사진 첨부</label><span className="text-[10px] text-[#8B929C]">{images.length}/5</span></div><input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={fileChanged}/>{images.length>0&&<div className="mt-3 grid grid-cols-3 gap-2">{images.map((image,index)=><div key={`${image.slice(0,24)}-${index}`} className="relative aspect-square"><img src={image} alt={`제출 이미지 ${index+1}`} className="h-full w-full rounded-[9px] object-cover"/><button type="button" onClick={()=>setImages(current=>current.filter((_,itemIndex)=>itemIndex!==index))} aria-label={`첨부 이미지 ${index+1} 삭제`} className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#14233B] text-white"><X size={12}/></button></div>)}</div>}<div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={images.length>=5} onClick={()=>fileRef.current?.click()} className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] border border-dashed border-[#C8C1B8] text-xs font-semibold text-[#687282] disabled:opacity-40"><Camera size={17}/>사진 선택</button>{isDemoMode&&<button type="button" disabled={images.length>=5} onClick={()=>setImages(current=>[...current,getStudentDemoImage(`${mission.title} 데모 ${current.length+1}`)].slice(0,5))} className="flex min-h-12 items-center justify-center gap-2 rounded-[10px] bg-[#F1E7D6] text-xs font-bold text-[#8A672F] disabled:opacity-40"><ImagePlus size={16}/>데모 이미지</button>}</div></section>}
    {needsText&&<section className="rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] p-4"><label htmlFor="student-comment" className="text-sm font-bold text-[#14233B]">학생 코멘트</label><textarea id="student-comment" value={message} onChange={(event)=>setMessage(event.target.value)} maxLength={500} rows={5} placeholder="한 일과 느낀 점을 적어주세요." className="mt-3 w-full resize-none rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] p-3 text-sm leading-6 outline-none focus:border-[#14233B]"/><p className="mt-1 text-right text-[10px] text-[#9A9FA7]">{message.length}/500</p></section>}
    {error&&<p role="alert" className="rounded-[10px] bg-[#F8EAE8] px-3 py-2 text-xs font-bold text-[#A14E49]">{error}</p>}
    <button type="button" onClick={()=>setConfirmOpen(true)} disabled={!valid||submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:bg-[#A7ABB2]"><Send size={17}/>제출 내용 확인</button>
  </main><Modal isOpen={confirmOpen} onClose={()=>setConfirmOpen(false)} title="제출하시겠어요?"><p className="text-sm leading-6 text-[#687282]">제출 후 상태가 승인 대기로 바뀝니다. 수정 요청을 받은 미션은 재제출 기록으로 저장됩니다.</p><div className="mt-5 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setConfirmOpen(false)} className="min-h-12 rounded-[10px] border border-[#D8D0C5] text-sm font-bold text-[#687282]">취소</button><button type="button" onClick={submit} disabled={submitting} className="min-h-12 rounded-[10px] bg-[#14233B] text-sm font-bold text-white disabled:opacity-50">{submitting?'제출 중':'제출'}</button></div></Modal></div>;
}
