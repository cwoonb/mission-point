import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock3, MessageCircle, Send, Users } from 'lucide-react';
import type { Mission } from '../../../types';
import type { LeaderClassRow, LeaderStudentRow } from '../../../utils/leaderAnalytics';
import { missionTypeLabel } from '../../../utils/studentStats';

export type ClassView = 'students' | 'missions';

export function ClassSummaryCard({ row }: { row: LeaderClassRow }) {
  const summary =
    row.pending > 0
      ? `${row.name}은 검토대기 ${row.pending}건이 있어 승인 처리가 필요합니다.`
      : row.missed > 0
        ? `${row.name}은 이번주 수행률이 ${row.weeklyRate}%이며, 미제출 학생 확인이 필요합니다.`
        : `${row.name}은 현재 미제출 없이 안정적으로 미션을 수행하고 있습니다.`;

  return (
    <section className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900">{row.emoji} {row.name}</h2>
          <p className="mt-0.5 text-[11px] font-bold text-slate-400">학생 {row.studentCount}명 · 진행 미션 {row.activeMissionCount}개</p>
        </div>
        <div className="text-right">
          <p className={`text-xl font-black ${row.weeklyRate >= 70 ? 'text-emerald-600' : row.weeklyRate >= 40 ? 'text-amber-600' : 'text-red-500'}`}>{row.weeklyRate}%</p>
          <p className="text-[9px] font-bold text-slate-400">수행률</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <span className="rounded-xl bg-red-50 px-2 py-2 text-center text-[10px] font-black text-red-600">미제출 {row.missed}</span>
        <span className="rounded-xl bg-amber-50 px-2 py-2 text-center text-[10px] font-black text-amber-600">검토대기 {row.pending}</span>
        <span className="rounded-xl bg-orange-50 px-2 py-2 text-center text-[10px] font-black text-orange-600">관심학생 {row.attention}</span>
      </div>
      <p className="mt-3 rounded-xl bg-purple-50 px-3 py-2 text-[11px] font-semibold leading-relaxed text-purple-700">
        {summary}
      </p>
    </section>
  );
}

export function ClassViewTabs({ value, onChange }: { value: ClassView; onChange: (value: ClassView) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
      {([
        ['students', '학생별 현황'],
        ['missions', '미션별 현황'],
      ] as const).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-xl py-2.5 text-xs font-black transition-all ${value === key ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-400'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function StudentAnalysisSummary({ student, expanded = false }: { student: LeaderStudentRow; expanded?: boolean }) {
  const inactiveDays = Math.max(0, Math.floor((Date.now() - new Date(student.lastActiveAt).getTime()) / 86400000));
  const shortSummary =
    inactiveDays >= 3 ? student.analysisSummary :
    student.missed >= 2 ? '최근 미제출이 증가하고 있습니다.' :
    student.readingRate >= 60 && student.homeworkRate < 50 ? '독서는 꾸준하지만 숙제 수행이 부족합니다.' :
    student.analysisSummary;
  return (
    <div className={`${expanded ? 'mt-3 bg-slate-50' : 'mt-1.5 bg-slate-50/80'} rounded-lg px-2.5 py-1.5`}>
      <p className="truncate text-[10px] font-semibold text-slate-600">
        <span className="mr-1 font-black text-purple-600">요약</span>{shortSummary}
      </p>
    </div>
  );
}

export function StudentProgressCard({
  student,
  expanded,
  onToggle,
  missedMissions,
}: {
  student: LeaderStudentRow;
  expanded: boolean;
  onToggle: () => void;
  missedMissions: Mission[];
}) {
  const [memo, setMemo] = useState('');
  const inactiveDays = Math.max(0, Math.floor((Date.now() - new Date(student.lastActiveAt).getTime()) / 86400000));
  const risk = student.attentionScore >= 61 ? 'RISK' : student.attentionScore >= 31 ? 'CAUTION' : 'NORMAL';
  const riskConfig = {
    RISK: { label: '위험', dot: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 text-red-600' },
    CAUTION: { label: '주의', dot: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700' },
    NORMAL: { label: '정상', dot: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  }[risk];

  return (
    <article className={`overflow-hidden rounded-xl border bg-white shadow-sm transition-colors ${expanded ? 'border-purple-200' : 'border-slate-100'}`}>
      <button type="button" onClick={onToggle} className="w-full p-2.5 text-left">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${riskConfig.dot}`} />
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-lg">{student.user.avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-[13px] font-black text-slate-900">{student.user.name}</h3>
              <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${riskConfig.badge}`}>{riskConfig.label}</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400">{student.className} · 최근 활동 {inactiveDays === 0 ? '오늘' : `${inactiveDays}일 전`}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-black ${riskConfig.text}`}>{student.weeklyRate}%</p>
            <p className="text-[8px] font-bold text-slate-400">수행률</p>
          </div>
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-slate-300">
            <ChevronDown size={15} />
          </motion.span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[9px] font-black">
          <span className={student.missed > 0 ? 'text-red-600' : 'text-slate-400'}>미제출 {student.missed}</span>
          <span className="text-slate-200">·</span>
          <span className="text-sky-600">진행 {student.active}</span>
          <span className="text-slate-200">·</span>
          <span className="text-emerald-600">완료 {student.completed}</span>
          {student.pending > 0 && <><span className="text-slate-200">·</span><span className="text-amber-600">검토 {student.pending}</span></>}
        </div>
        <StudentAnalysisSummary student={student} />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-100 px-3 pb-3 pt-3">
              <div className="mb-3">
                <div className="mb-1 flex justify-between text-[10px] font-black text-slate-500">
                  <span>수행률</span><span>{student.weeklyRate}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${risk === 'RISK' ? 'bg-red-500' : risk === 'CAUTION' ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${student.weeklyRate}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  ['진행', student.active],
                  ['완료', student.completed],
                  ['미제출', student.missed],
                  ['검토', student.pending],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-lg bg-slate-50 py-2 text-center">
                    <p className="text-sm font-black text-slate-800">{value as number}</p>
                    <p className="text-[8px] font-bold text-slate-400">{label as string}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-[9px] font-bold text-slate-500">
                <span>숙제 <b className="block text-slate-800">{student.homeworkRate}%</b></span>
                <span>독서 <b className="block text-slate-800">{student.readingRate}%</b></span>
                <span>연속 <b className="block text-orange-600">{student.streak}일</b></span>
                <span>미제출 <b className="block text-red-600">{student.missed}건</b></span>
              </div>

              <div className="mt-3 rounded-lg border border-red-100 bg-red-50/50 p-2.5">
                <p className="text-[10px] font-black text-red-700">미제출 미션</p>
                {missedMissions.length ? (
                  <ul className="mt-1 space-y-1">
                    {missedMissions.slice(0, 3).map((mission) => <li key={mission.id} className="truncate text-[10px] font-semibold text-slate-600">• {mission.title}</li>)}
                  </ul>
                ) : <p className="mt-1 text-[10px] text-slate-400">미제출 미션이 없습니다.</p>}
              </div>

              <div className="mt-3 rounded-lg bg-purple-50 p-2.5">
                <p className="text-[10px] font-black text-purple-700">활동 요약</p>
                <p className="mt-1 text-[10px] font-semibold leading-relaxed text-slate-600">
                  {student.analysisSummary} {student.missed > 0 ? `미제출 ${student.missed}건에 대한 보호자 안내를 권장합니다.` : '현재 수행 패턴을 유지해 주세요.'}
                </p>
              </div>

              <label className="mt-3 block">
                <span className="flex items-center gap-1 text-[10px] font-black text-slate-600"><MessageCircle size={12} /> 리더 메모</span>
                <textarea value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="상담 내용이나 관리 메모 입력" rows={2} className="mt-1 w-full resize-none rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2 text-[10px] outline-none focus:border-purple-300" />
              </label>

              <button
                type="button"
                onClick={() => window.open(`sms:?body=${encodeURIComponent(`${student.user.name} 학생의 미션 현황을 확인해 주세요. 미제출 ${student.missed}건입니다.`)}`)}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-purple-600 py-2.5 text-[11px] font-black text-white"
              >
                <Send size={13} /> 부모에게 메시지 보내기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

export function StudentProgressList({ students, missions }: { students: LeaderStudentRow[]; missions: Mission[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (students.length === 0) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400">이 반에 등록된 학생이 없습니다.</div>;
  }
  return (
    <section className="space-y-1.5">
      {students.map((student) => (
        <StudentProgressCard
          key={student.user.id}
          student={student}
          expanded={expandedId === student.user.id}
          onToggle={() => setExpandedId((current) => current === student.user.id ? null : student.user.id)}
          missedMissions={missions.filter((mission) =>
            mission.assigneeId === student.user.id &&
            ['IN_PROGRESS', 'PENDING', 'EXPIRED', 'FAILED'].includes(mission.status)
          )}
        />
      ))}
    </section>
  );
}

export function MissionByClassCard({ mission, onOpen }: { mission: Mission; onOpen: () => void }) {
  const completion = mission.status === 'SUCCESS' ? 100 : mission.status === 'REVIEWING' ? 85 : mission.status === 'REJECTED' ? 45 : 35;
  const submitted = mission.status === 'SUCCESS' || mission.status === 'REVIEWING' ? 1 : 0;
  const pending = mission.status === 'REVIEWING' ? 1 : 0;
  const missed = submitted ? 0 : 1;

  return (
    <button onClick={onOpen} className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm active:scale-[0.99]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-black text-slate-900">{mission.title}</h3>
          <p className="mt-1 text-[10px] font-bold text-slate-400">{missionTypeLabel[mission.missionType ?? 'OTHER']} · {new Date(mission.endDate).toLocaleDateString('ko-KR')} 마감</p>
        </div>
        <ChevronRight size={16} className="shrink-0 text-slate-300" />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[9px] font-black">
        <span className="flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-slate-600"><Users size={11} /> 대상 1명</span>
        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-600">제출 {submitted}</span>
        <span className="rounded-lg bg-red-50 px-2 py-1 text-red-600">미제출 {missed}</span>
        <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-amber-600"><Clock3 size={11} /> 검토 {pending}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400" style={{ width: `${completion}%` }} />
        </div>
        <span className="text-[10px] font-black text-slate-500">완료율 {completion}%</span>
      </div>
    </button>
  );
}

export function MissionByClassList({ missions, onOpen }: { missions: Mission[]; onOpen: (id: string) => void }) {
  if (missions.length === 0) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-400">조건에 맞는 미션이 없습니다.</div>;
  }
  return (
    <section className="space-y-2">
      {missions.map((mission) => <MissionByClassCard key={mission.id} mission={mission} onOpen={() => onOpen(mission.id)} />)}
    </section>
  );
}
