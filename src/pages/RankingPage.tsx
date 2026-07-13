import { useState } from 'react';
import { Heart, Users } from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';

export default function RankingPage() {
  const { currentUser, users } = useAuthStore();
  const [message, setMessage] = useState('');
  if (!currentUser) return null;
  const friends = users.filter((user) => user.role === 'CHILD' && user.groupId === currentUser.groupId);

  return <div className="page-container bg-slate-50"><Header title="친구" showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-5">
    <section className="rounded-3xl bg-gradient-to-br from-purple-50 to-white p-5 shadow-sm"><Users size={22} className="text-purple-600"/><h1 className="mt-2 text-xl font-black text-slate-800">함께 활동하는 친구들</h1><p className="mt-1 text-sm text-slate-400">서로의 참여를 편하게 응원해요.</p></section>
    <section className="space-y-2">{friends.map((friend) => <div key={friend.id} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-2xl">{friend.avatar}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-800">{friend.name}{friend.id === currentUser.id ? ' · 나' : ''}</p><p className="text-[11px] font-bold text-slate-400">같은 반에서 함께 활동하는 친구</p></div>{friend.id !== currentUser.id && <button onClick={() => { setMessage(`${friend.name}님에게 응원을 보냈어요.`); setTimeout(() => setMessage(''), 1600); }} className="flex min-h-11 items-center gap-1 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-500"><Heart size={13}/>응원</button>}</div>)}{friends.length === 0 && <div className="rounded-3xl bg-white py-12 text-center text-sm text-slate-400">같은 반 친구가 없습니다.</div>}</section>
    {message && <div role="status" className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-xs rounded-2xl bg-rose-500 px-4 py-3 text-center text-sm font-black text-white shadow-lg">{message}</div>}
  </main></div>;
}
