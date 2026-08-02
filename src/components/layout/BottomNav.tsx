import { NavLink } from 'react-router-dom';
import { History, Home, Target, User, UsersRound } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../store/authStore';
import { useMissionStore } from '../../store/missionStore';
import { getActiveDemoScenario } from '../../data/demoSession';
import { useMembershipStore } from '../../store/membershipStore';
import type { MembershipRole } from '../../types';
import { missionInOrganization } from '../../utils/membershipScope';

type NavTab = { to: string; icon: typeof Home; label: string; badge?: number };

export const getBottomNavTabs=(role:MembershipRole|undefined,memberLabel='학생',pendingReviews=0):NavTab[]=>role==='STUDENT'?
  [{to:'/',icon:Home,label:'홈'},{to:'/missions',icon:Target,label:'미션'},{to:'/activity',icon:History,label:'활동'},{to:'/profile',icon:User,label:'내 정보'}]:
  [{to:'/',icon:Home,label:'홈'},{to:'/missions',icon:Target,label:'미션',badge:pendingReviews},{to:'/students',icon:UsersRound,label:memberLabel},{to:'/profile',icon:User,label:'내 정보'}];

export default function BottomNav() {
  const { currentUser } = useAuthStore();
  const activeMembership = useMembershipStore((state)=>state.memberships.find((membership)=>membership.id===state.activeMembershipId));
  const viewMode = activeMembership?.role === 'STUDENT' ? 'PERFORMER' : 'FACILITATOR';
  const missions = useMissionStore((state) => state.missions);
  const pendingReviews = missions.filter((mission) => mission.status === 'REVIEWING' && mission.creatorId === currentUser?.id&&missionInOrganization(mission,activeMembership?.organizationId)).length;
  const memberLabel = currentUser?.id.startsWith('demo-') && viewMode === 'FACILITATOR' ? getActiveDemoScenario().memberLabel : '학생';
  const tabs=getBottomNavTabs(activeMembership?.role,memberLabel,pendingReviews);
  return <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto max-w-[430px] border-t border-[#E7E1D9] bg-[#FFFDFC]/96 backdrop-blur-md" style={{paddingBottom:'env(safe-area-inset-bottom, 0px)'}}><div className="grid items-center py-1.5" style={{gridTemplateColumns:`repeat(${tabs.length},minmax(0,1fr))`}}>{tabs.map(({to,icon:Icon,label,badge})=><NavLink key={to} to={to} end={to==='/'||to==='/activity'} className={({isActive})=>clsx('flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1 px-2 py-1 transition-colors',isActive?'text-[#14233B]':'text-[#9299A3]')}>{({isActive})=><><div className="relative"><div className={clsx('flex h-7 w-9 items-center justify-center rounded-[8px]',isActive&&'bg-[#E9EDF2]')}><Icon size={20} strokeWidth={isActive?2.5:1.8}/></div>{badge!=null&&badge>0&&<span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#B35F5A] px-1 text-[9px] font-bold text-white">{badge>9?'9+':badge}</span>}</div><span className="truncate text-[10px] font-semibold">{label}</span></>}</NavLink>)}</div></nav>;
}
