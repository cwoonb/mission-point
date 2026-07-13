import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import Header from '../layout/Header';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';
import { useMissionStore } from '../../store/missionStore';
import { buildLeaderSnapshot } from '../../utils/leaderAnalytics';
import type { MissionStatus } from '../../types';
import {
  ClassSummaryCard,
  ClassViewTabs,
  MissionByClassList,
  StudentProgressList,
  type ClassView,
} from './mission/ClassMissionViews';
import AnalyticsPeriodSelector from './mission/AnalyticsPeriodSelector';
import {
  filterMissionsByAnalyticsPeriod,
  getAnalyticsPeriodLabel,
  useAnalyticsPeriodStore,
} from '../../store/analyticsPeriodStore';

type StatusKey = 'ALL' | MissionStatus;
type StudentFilter = 'ALL' | 'RISK' | 'CAUTION' | 'MISSED' | 'INACTIVE';

const statusOptions: Array<[StatusKey, string]> = [
  ['ALL', '전체'],
  ['IN_PROGRESS', '진행중'],
  ['REVIEWING', '검토대기'],
  ['SUCCESS', '완료'],
  ['REJECTED', '반려'],
  ['EXPIRED', '만료'],
];

export default function LeaderMissionDashboard({
  embedded = false,
  statusFilter = 'ALL',
  statusFilters,
}: {
  embedded?: boolean;
  statusFilter?: StatusKey;
  statusFilters?: MissionStatus[];
}) {
  const navigate = useNavigate();
  const { currentUser, users } = useAuthStore();
  const missions = useMissionStore((state) => state.missions);
  const groups = useGroupStore((state) => state.groups);
  const [classId, setClassId] = useState('all');
  const [status, setStatus] = useState<StatusKey>(statusFilter);
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ClassView>(embedded ? 'missions' : 'students');
  const [studentFilter, setStudentFilter] = useState<StudentFilter>('ALL');
  const { selectedPeriod, customStart, customEnd } = useAnalyticsPeriodStore();

  useEffect(() => {
    if (!embedded) setView('students');
  }, [classId, embedded]);

  useEffect(() => {
    setStatus(statusFilter);
    if (embedded) setView('missions');
  }, [embedded, statusFilter]);

  if (!currentUser) return null;
  const periodMissions = filterMissionsByAnalyticsPeriod(missions, selectedPeriod, customStart, customEnd);
  const periodLabel = getAnalyticsPeriodLabel(selectedPeriod);
  const snapshot = buildLeaderSnapshot(users, periodMissions, groups, currentUser.id, periodLabel, missions);
  const created = periodMissions.filter((mission) => mission.creatorId === currentUser.id);
  const selectedClass = snapshot.classes.find((row) => row.id === classId);

  const riskLevel = (attentionScore: number) => attentionScore >= 61 ? 2 : attentionScore >= 31 ? 1 : 0;
  const inactiveDays = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  const classStudents = snapshot.students
    .filter((student) =>
      classId === 'all' ||
      student.user.groupId === classId ||
      (classId === 'unassigned' && !student.user.groupId)
    );
  const selectedStudents = classStudents
    .filter((student) =>
      studentFilter === 'ALL' ||
      (studentFilter === 'RISK' && riskLevel(student.attentionScore) === 2) ||
      (studentFilter === 'CAUTION' && riskLevel(student.attentionScore) === 1) ||
      (studentFilter === 'MISSED' && student.missed > 0) ||
      (studentFilter === 'INACTIVE' && inactiveDays(student.lastActiveAt) >= 3)
    )
    .sort((a, b) =>
      riskLevel(b.attentionScore) - riskLevel(a.attentionScore) ||
      b.missed - a.missed ||
      inactiveDays(b.lastActiveAt) - inactiveDays(a.lastActiveAt) ||
      a.weeklyRate - b.weeklyRate
    );

  const selectedStudentIds = new Set(selectedStudents.map((student) => student.user.id));
  const selectedMissions = created.filter((mission) => {
    const classMatch = classId === 'all' || selectedStudentIds.has(mission.assigneeId);
    const statusMatch = statusFilters?.length
      ? statusFilters.includes(mission.status)
      : status === 'ALL' || mission.status === status;
    const queryMatch = !query || mission.title.toLowerCase().includes(query.toLowerCase());
    return classMatch && statusMatch && queryMatch;
  });

  return (
    <div className={embedded ? '' : 'page-container bg-slate-50'}>
      {!embedded && <Header
        title="미션"
        showBack={false}
        showPoints
        rightElement={
          <button onClick={() => navigate('/missions/create')} aria-label="미션 추가" className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md">
            <Plus size={18} />
          </button>
        }
      />}
      <main className={embedded ? 'space-y-2 px-3 py-2' : 'content-area space-y-2 px-3 py-2'}>
        <section className="rounded-xl bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400">전체 학생</p>
              <p className="text-xl font-black text-slate-900">{snapshot.totalStudents}<span className="text-xs">명</span></p>
            </div>
            <div className="flex gap-3 text-center">
              <div><p className="text-sm font-black text-emerald-600">{snapshot.students.filter((student) => riskLevel(student.attentionScore) === 0).length}</p><p className="text-[8px] font-bold text-slate-400">정상</p></div>
              <div><p className="text-sm font-black text-amber-500">{snapshot.students.filter((student) => riskLevel(student.attentionScore) === 1).length}</p><p className="text-[8px] font-bold text-slate-400">주의</p></div>
              <div><p className="text-sm font-black text-red-600">{snapshot.students.filter((student) => riskLevel(student.attentionScore) === 2).length}</p><p className="text-[8px] font-bold text-slate-400">위험</p></div>
            </div>
            <div className="border-l border-slate-100 pl-3 text-right">
              <p className="text-[9px] font-black text-red-600">미제출 {snapshot.missedCount}</p>
              <p className="mt-1 text-[9px] font-black text-amber-600">검토대기 {snapshot.pendingReviewCount}</p>
            </div>
          </div>
        </section>

        <section className="space-y-1">
          {view === 'missions' && <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="미션 검색" className="w-full rounded-2xl border border-slate-100 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-purple-300" />
          </div>}
          {view === 'students' && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {([
                ['ALL', '전체'],
                ['RISK', '위험'],
                ['CAUTION', '주의'],
                ['MISSED', '미제출'],
                ['INACTIVE', '최근 미활동'],
              ] as const).map(([key, label]) => (
                <button key={key} onClick={() => setStudentFilter(key)} className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-black ${studentFilter === key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>{label}</button>
              ))}
            </div>
          )}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setClassId('all')} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${classId === 'all' ? 'bg-purple-600 text-white' : 'bg-white text-slate-500'}`}>전체</button>
            {snapshot.classes.map((row) => (
              <button key={row.id} onClick={() => setClassId(row.id)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-black ${classId === row.id ? 'bg-purple-600 text-white' : 'bg-white text-slate-500'}`}>
                {row.emoji} {row.name}
              </button>
            ))}
          </div>
        </section>

        {selectedClass && <ClassSummaryCard row={selectedClass} />}

        <ClassViewTabs value={view} onChange={setView} />
        <AnalyticsPeriodSelector />

        {view === 'students' ? (
          <motion.div key={`students-${selectedPeriod}-${customStart}-${customEnd}`} initial={{ opacity: 0.35, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
            <StudentProgressList students={selectedStudents} missions={created} />
          </motion.div>
        ) : (
          <motion.div key={`missions-${selectedPeriod}-${customStart}-${customEnd}`} initial={{ opacity: 0.35, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {statusOptions.map(([key, label]) => (
                <button key={key} onClick={() => setStatus(key)} className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-black ${status === key ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{label}</button>
              ))}
            </div>
            <MissionByClassList missions={selectedMissions} onOpen={(id) => navigate(`/missions/${id}`)} />
          </motion.div>
        )}
      </main>
    </div>
  );
}
