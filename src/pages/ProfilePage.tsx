import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, ChevronRight, LogOut, Pencil, RefreshCw, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import Header from '../components/layout/Header';
import { getDemoKind, getSelectedDemoScenarioId, resetDemoSession, startDemoScenario } from '../data/demoSession';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';

export default function ProfilePage(){
  const navigate=useNavigate();
  const {currentUser,isDemoMode,updateUserName,updateProfileImage,logout}=useAuthStore();
  const groups=useGroupStore((state)=>state.groups);
  const fileRef=useRef<HTMLInputElement>(null);
  const [editing,setEditing]=useState(false);
  const [name,setName]=useState(currentUser?.name??'');
  const [notifications,setNotifications]=useState(true);
  if(!currentUser)return null;
  const student=currentUser.role==='CHILD';
  const studentDemo=isDemoMode&&getDemoKind()==='student';
  const groupName=groups.find((group)=>group.id===currentUser.groupId)?.name??'소속 없음';
  const connectedTeacher=useAuthStore.getState().users.find((user)=>user.id===currentUser.facilitatorId&&(user.role==='PARENT'||user.role==='TEACHER'));
  const saveName=()=>{if(!name.trim())return;updateUserName(currentUser.id,name.trim());setEditing(false);};
  const imageChanged=(file?:File)=>{if(!file)return;const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'&&updateProfileImage(currentUser.id,reader.result);reader.readAsDataURL(file);};
  const signOut=()=>{logout();navigate('/login',{replace:true});};
  return <div className="page-container bg-[#F8F5F0]"><Header title="내 정보" showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-5"><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event)=>imageChanged(event.target.files?.[0])}/>
    <section className="rounded-[16px] border border-[#E7E1D9] bg-[#FFFDFC] p-5"><div className="flex items-center gap-4"><button type="button" onClick={()=>fileRef.current?.click()} aria-label="프로필 사진 변경" className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] text-xl font-bold text-[#14233B]">{currentUser.profileImage?<img src={currentUser.profileImage} alt="" className="h-full w-full object-cover"/>:currentUser.name.slice(0,1)}<span className="absolute bottom-1 right-1 rounded-full border border-[#E7E1D9] bg-white p-1"><Camera size={13}/></span></button><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#B58A4A]">{student?groupName:'운영자'}</p>{editing?<div className="mt-1 flex gap-2"><input value={name} onChange={(event)=>setName(event.target.value)} className="min-w-0 flex-1 rounded-[9px] border border-[#D8D0C5] px-3 py-2 text-sm"/><button type="button" onClick={saveName} className="rounded-[9px] bg-[#14233B] px-3 text-xs font-bold text-white">저장</button></div>:<div className="flex items-center gap-2"><h1 className="truncate text-2xl font-bold text-[#14233B]">{currentUser.name}</h1><button type="button" onClick={()=>setEditing(true)} aria-label="이름 수정" className="flex h-11 w-11 items-center justify-center text-[#687282]"><Pencil size={15}/></button></div>}<p className="mt-1 text-xs text-[#9299A3]">{student?'학생':'선생님'}</p></div></div></section>
    {student?<section className="overflow-hidden rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC]"><div className="flex min-h-16 items-center gap-3 border-b border-[#ECE7E0] px-4"><ShieldCheck size={19} className="text-[#B58A4A]"/><span className="flex-1"><strong className="block text-sm text-[#27313F]">초대 코드 연결</strong><span className="text-xs text-[#8B929C]">{connectedTeacher?`${connectedTeacher.name} 선생님 · ${connectedTeacher.code}`:'연결 정보 없음'}</span></span></div><label className="flex min-h-16 items-center gap-3 px-4"><Bell size={19} className="text-[#B58A4A]"/><span className="flex-1"><strong className="block text-sm text-[#27313F]">알림 설정</strong><span className="text-xs text-[#8B929C]">미션과 피드백 알림</span></span><input type="checkbox" checked={notifications} onChange={(event)=>setNotifications(event.target.checked)} className="h-5 w-5 accent-[#14233B]"/></label></section>:<section className="overflow-hidden rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC]"><div className="flex min-h-16 items-center gap-3 border-b border-[#ECE7E0] px-4"><UserRound size={19} className="text-[#B58A4A]"/><span className="flex-1"><strong className="block text-sm text-[#27313F]">계정 정보</strong><span className="text-xs text-[#8B929C]">{currentUser.socialProvider?`${currentUser.socialProvider} 연결됨`:'데모 또는 일반 계정'}</span></span></div><button type="button" onClick={()=>navigate('/profile/status-settings')} className="flex min-h-16 w-full items-center gap-3 px-4 text-left"><Bell size={19} className="text-[#B58A4A]"/><span className="flex-1"><strong className="block text-sm text-[#27313F]">상태 기준 설정</strong><span className="text-xs text-[#8B929C]">학생 관리 기준</span></span><ChevronRight size={16}/></button></section>}
    {studentDemo&&<section className="space-y-2 rounded-[14px] border border-[#D8D0C5] bg-[#F3EFE9] p-4"><p className="text-xs font-bold text-[#B58A4A]">DEMO · 현재: 학생</p><button type="button" onClick={()=>{resetDemoSession();navigate('/',{replace:true});window.location.reload();}} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] border border-[#D8D0C5] bg-[#FFFDFC] text-sm font-bold text-[#14233B]"><RotateCcw size={17}/>학생 데모 초기화</button><button type="button" onClick={()=>{startDemoScenario(getSelectedDemoScenarioId());navigate('/',{replace:true});}} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[#14233B] text-sm font-bold text-white"><RefreshCw size={17}/>운영자 데모로 돌아가기</button></section>}
    <button type="button" onClick={signOut} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[10px] border border-[#DFB9B5] bg-[#FFF8F7] text-sm font-bold text-[#B35F5A]"><LogOut size={17}/>로그아웃</button>
  </main></div>;
}
