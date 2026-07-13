import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, ChevronRight, LogOut, Pencil, UserRound } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateUserName, updateProfileImage, logout } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? '');
  if (!currentUser) return null;
  const saveName = () => { if (!name.trim()) return; updateUserName(currentUser.id, name.trim()); setEditing(false); };
  const changeImage = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' && updateProfileImage(currentUser.id, reader.result); reader.readAsDataURL(file); };
  return <div className="page-container bg-[#F8F5F0]"><Header title="내 정보" showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-5">
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event)=>changeImage(event.target.files?.[0])}/>
    <section className="premium-panel p-5"><div className="flex items-center gap-4"><button onClick={()=>fileRef.current?.click()} aria-label="프로필 사진 변경" className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] text-xl font-bold text-[#14233B]">{currentUser.profileImage?<img src={currentUser.profileImage} alt="" className="h-full w-full object-cover"/>:currentUser.name.slice(0,1)}<span className="absolute bottom-1 right-1 rounded-full border border-[#E7E1D9] bg-white p-1 text-[#14233B]"><Camera size={13}/></span></button><div className="min-w-0 flex-1"><p className="text-xs font-medium text-[#687282]">{currentUser.role==='CHILD'?'수행자':'운영자'}</p>{editing?<div className="mt-1 flex gap-2"><input value={name} onChange={(e)=>setName(e.target.value)} className="min-w-0 flex-1 rounded-[10px] border border-[#E7E1D9] bg-white px-3 py-2 text-sm font-bold outline-none"/><button onClick={saveName} className="rounded-[10px] bg-[#14233B] px-3 text-xs font-bold text-white">저장</button></div>:<div className="flex items-center gap-2"><h1 className="truncate text-2xl font-bold text-[#14233B]">{currentUser.name}</h1><button onClick={()=>setEditing(true)} aria-label="이름 수정" className="flex h-11 w-11 items-center justify-center text-[#687282]"><Pencil size={15}/></button></div>}<p className="mt-1 truncate text-xs text-[#9299A3]">{currentUser.email??currentUser.id}</p></div></div></section>
    <section className="overflow-hidden rounded-[14px] border border-[#E7E1D9] bg-[#FFFDFC] shadow-sm">
      <div className="flex min-h-16 items-center gap-3 border-b border-[#ECE7E0] px-5"><UserRound size={19} className="text-[#B58A4A]"/><span className="flex-1"><span className="block text-sm font-bold text-[#27313F]">계정 정보</span><span className="text-xs text-[#8B929C]">{currentUser.socialProvider ? `${currentUser.socialProvider} 계정 연결됨` : '데모 또는 일반 계정'}</span></span></div>
      <button type="button" onClick={()=>navigate('/profile/status-settings')} className="flex min-h-16 w-full items-center gap-3 px-5 text-left"><Bell size={19} className="text-[#B58A4A]"/><span className="flex-1"><span className="block text-sm font-bold text-[#27313F]">알림 설정</span><span className="text-xs text-[#8B929C]">미션 및 제출 상태 알림</span></span><ChevronRight size={16} className="text-[#B5B7BC]"/></button>
    </section>
    <button onClick={()=>{logout();navigate('/login',{replace:true});}} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[10px] border border-[#DFB9B5] bg-[#FFF8F7] text-sm font-bold text-[#B35F5A]"><LogOut size={17}/> 로그아웃</button>
    <p className="text-center text-[10px] text-slate-300">Mission v0.1.0</p>
  </main></div>;
}
