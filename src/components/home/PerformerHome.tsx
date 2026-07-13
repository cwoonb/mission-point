import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, ClipboardCheck, Clock3, Target } from 'lucide-react';
import Modal from '../ui/Modal';
import { useAuthStore } from '../../store/authStore';
import { useMissionStore } from '../../store/missionStore';
import type { Mission } from '../../types';

const statusLabel: Record<string, string> = {
  IN_PROGRESS: '진행 중', REVIEWING: '승인 대기', REJECTED: '재제출 필요', SUCCESS: '완료',
};

function MissionRow({ mission, onOpen }: { mission: Mission; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm active:scale-[0.99]">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600"><ClipboardCheck size={19} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-slate-800">{mission.title}</span>
        <span className="mt-1 block text-[11px] font-bold text-slate-400">{statusLabel[mission.status] ?? mission.status} · {new Date(mission.endDate).toLocaleDateString('ko-KR')}까지</span>
      </span>
      <ChevronRight size={16} className="text-slate-300" />
    </button>
  );
}

export default function PerformerHome() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const missions = useMissionStore((state) => state.missions);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  if (!currentUser) return null;

  const mine = missions.filter((mission) => mission.assigneeId === currentUser.id);
  const active = mine.filter((mission) => ['IN_PROGRESS', 'REJECTED', 'REVIEWING'].includes(mission.status));
  const rejected = mine.filter((mission) => mission.status === 'REJECTED');
  const reviewing = mine.filter((mission) => mission.status === 'REVIEWING');

  return (
    <div className="page-container bg-slate-50">
      <main className="content-area space-y-4 px-4 py-5">
        <header className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-100 text-3xl">{currentUser.avatar}</div>
          <div className="min-w-0 flex-1"><p className="text-xs font-bold text-slate-400">오늘도 차근차근 진행해요</p><h1 className="truncate text-xl font-black text-slate-900">{currentUser.name}님</h1></div>
          <button type="button" aria-label="알림" onClick={() => setNotificationsOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm"><Bell size={20} /></button>
        </header>

        <section className="grid grid-cols-3 gap-2">
          {[{label:'진행 중',value:active.filter((m) => m.status === 'IN_PROGRESS').length,icon:Target},{label:'승인 대기',value:reviewing.length,icon:Clock3},{label:'재제출',value:rejected.length,icon:ClipboardCheck}].map(({label,value,icon:Icon}) => (
            <div key={label} className="rounded-2xl bg-white p-3 text-center shadow-sm"><Icon size={17} className="mx-auto text-purple-500" /><p className="mt-1 text-xl font-black text-slate-800">{value}</p><p className="text-[10px] font-bold text-slate-400">{label}</p></div>
          ))}
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between"><h2 className="font-black text-slate-800">내 미션</h2><button type="button" onClick={() => navigate('/missions')} className="min-h-11 px-2 text-xs font-black text-purple-600">전체 보기</button></div>
          <div className="space-y-2">{active.slice(0, 5).map((mission) => <MissionRow key={mission.id} mission={mission} onOpen={() => navigate(`/missions/${mission.id}`)} />)}</div>
          {active.length === 0 && <div className="rounded-3xl bg-white px-5 py-12 text-center shadow-sm"><p className="font-black text-slate-700">진행할 미션이 없어요</p></div>}
        </section>
      </main>

      <Modal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} title="알림">
        <div className="space-y-2">
          {rejected.length === 0 && reviewing.length === 0 ? <p className="rounded-2xl bg-slate-50 py-8 text-center text-sm text-slate-400">새 알림이 없어요.</p> : null}
          {rejected.map((mission) => <MissionRow key={mission.id} mission={mission} onOpen={() => { setNotificationsOpen(false); navigate(`/missions/${mission.id}`); }} />)}
          {reviewing.map((mission) => <MissionRow key={mission.id} mission={mission} onOpen={() => { setNotificationsOpen(false); navigate(`/missions/${mission.id}`); }} />)}
        </div>
      </Modal>
    </div>
  );
}
