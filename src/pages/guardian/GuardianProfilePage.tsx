import { Bell, Building2, ChevronRight, LogOut, RefreshCw, RotateCcw, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useGuardianStore } from '../../store/guardianStore';
import { useMembershipStore } from '../../store/membershipStore';
import { resetDemoSession, startDemoScenario } from '../../data/demoSession';

export default function GuardianProfilePage() {
  const navigate = useNavigate();
  const { currentUser, users, logout, isDemoMode } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { guardians, links, updateNotifications, clear } = useGuardianStore();
  const { organizations, memberships, activeMembershipId, clearActiveMembership } = useMembershipStore();
  const active = memberships.find((item) => item.id === activeMembershipId);
  const guardian = guardians.find((item) => item.organizationId === active?.organizationId && (item.authUserId === currentUser?.authUserId || item.authUserId === currentUser?.id));
  const myLinks = links.filter((link) => link.guardianId === guardian?.id && link.status === 'ACTIVE');
  const signOut = async () => { clear(); clearActiveMembership(); const error = await logout(); if (!error) navigate('/login', { replace: true }); };
  if (!currentUser || !active) return null;
  return <div className="page-container bg-[#F8F5F0]"><Header title="내 정보" showBack={false} showPoints={false}/><main className="content-area space-y-4 px-4 py-5">
    <section className="rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC] p-5"><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F1E7D6] text-xl font-bold text-[#14233B]">{currentUser.name.slice(0, 1)}</div><div><h1 className="text-xl font-bold text-[#14233B]">{guardian?.name ?? currentUser.name}</h1><p className="mt-1 text-xs text-[#687282]">보호자</p><p className="mt-1 text-[10px] text-[#8B929C]">{guardian?.phone || '연락처 미등록'} · {guardian?.email || currentUser.email || '이메일 미등록'}</p></div></div></section>
    <section><h2 className="mb-2 px-1 text-xs font-bold text-[#53606F]">연결 학생</h2><div className="overflow-hidden rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC]">{myLinks.map((link) => { const student = users.find((user) => user.id === link.studentId); const group = groups.find((item) => item.id === student?.groupId); return <div key={link.id} className="flex min-h-20 items-center gap-3 border-b border-[#EEE9E2] px-4 last:border-0"><UsersRound size={18} className="text-[#B58A4A]"/><div><strong className="block text-sm text-[#14233B]">{student?.name ?? '학생'}</strong><p className="mt-1 text-xs text-[#687282]">{group?.name ?? '반 미지정'} · {link.relationship}{link.isPrimary ? ' · 주 보호자' : ''}</p></div></div>; })}</div></section>
    <section className="overflow-hidden rounded-[14px] border border-[#E1DBD3] bg-[#FFFDFC]"><label className="flex min-h-16 items-center gap-3 border-b border-[#EEE9E2] px-4"><Bell size={18} className="text-[#B58A4A]"/><span className="flex-1 text-sm font-semibold text-[#14233B]">알림 설정</span><input type="checkbox" checked={guardian?.notificationsEnabled ?? true} onChange={(event) => guardian && void updateNotifications(guardian.id, event.target.checked)} className="h-5 w-5 accent-[#14233B]"/></label><button onClick={() => navigate('/memberships')} className="flex min-h-16 w-full items-center gap-3 px-4 text-left"><Building2 size={18} className="text-[#B58A4A]"/><span className="flex-1"><strong className="block text-sm text-[#14233B]">소속 및 역할 전환</strong><span className="text-xs text-[#687282]">{organizations.find((item) => item.id === active.organizationId)?.name}</span></span><ChevronRight size={16}/></button></section>
    {isDemoMode && <section className="overflow-hidden rounded-[14px] border border-[#D8C39D] bg-[#FFFCF7]"><div className="px-4 py-3 text-[11px] font-bold text-[#9A7138]">DEMO · 현재: 학부모</div><button onClick={() => { resetDemoSession(); navigate('/', { replace: true }); }} className="flex min-h-14 w-full items-center gap-3 border-t border-[#EEE0C7] px-4 text-left"><RotateCcw size={17}/><span className="flex-1 text-sm font-semibold">학부모 데모 초기화</span></button><button onClick={() => { startDemoScenario('study-room'); navigate('/', { replace: true }); }} className="flex min-h-14 w-full items-center gap-3 border-t border-[#EEE0C7] px-4 text-left"><RefreshCw size={17}/><span className="flex-1 text-sm font-semibold">운영자 데모로 전환</span></button></section>}
    <button onClick={() => void signOut()} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-[10px] border border-[#DFB9B5] bg-[#FFF8F7] text-sm font-bold text-[#B35F5A]"><LogOut size={17}/>로그아웃</button>
  </main></div>;
}
