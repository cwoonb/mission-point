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
  return <div className="page-container bg-slate-50"><Header title="내 정보" showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-5">
    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event)=>changeImage(event.target.files?.[0])}/>
    <section className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 p-5 text-white shadow-lg"><div className="flex items-center gap-4"><button onClick={()=>fileRef.current?.click()} aria-label="프로필 사진 변경" className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/20 text-4xl">{currentUser.profileImage?<img src={currentUser.profileImage} alt="" className="h-full w-full object-cover"/>:currentUser.avatar}<span className="absolute bottom-1 right-1 rounded-full bg-white p-1 text-purple-600"><Camera size={13}/></span></button><div className="min-w-0 flex-1"><p className="text-xs font-bold text-white/60">{currentUser.role==='CHILD'?'수행자':'리더'}</p>{editing?<div className="mt-1 flex gap-2"><input value={name} onChange={(e)=>setName(e.target.value)} className="min-w-0 flex-1 rounded-xl bg-white/15 px-3 py-2 text-sm font-bold outline-none"/><button onClick={saveName} className="rounded-xl bg-white px-3 text-xs font-black text-purple-600">저장</button></div>:<div className="flex items-center gap-2"><h1 className="truncate text-2xl font-black">{currentUser.name}</h1><button onClick={()=>setEditing(true)} aria-label="이름 수정" className="p-2"><Pencil size={15}/></button></div>}<p className="mt-1 truncate text-xs text-white/60">{currentUser.email??currentUser.id}</p></div></div></section>
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm">{[{label:'계정 정보',sub:'로그인 계정과 연결 상태',icon:UserRound,onClick:()=>{}},{label:'알림 설정',sub:'미션 및 제출 상태 알림',icon:Bell,onClick:()=>navigate('/profile/status-settings')}].map(({label,sub,icon:Icon,onClick})=><button key={label} onClick={onClick} className="flex min-h-16 w-full items-center gap-3 border-b border-slate-50 px-5 text-left last:border-0"><Icon size={19} className="text-purple-500"/><span className="flex-1"><span className="block text-sm font-black text-slate-800">{label}</span><span className="text-xs text-slate-400">{sub}</span></span><ChevronRight size={16} className="text-slate-300"/></button>)}</section>
    <button onClick={()=>{logout();navigate('/login',{replace:true});}} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-black text-red-500 shadow-sm"><LogOut size={17}/> 로그아웃</button>
    <p className="text-center text-[10px] text-slate-300">Mission v0.1.0</p>
  </main></div>;
}
