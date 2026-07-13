import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileText,
  MessageSquarePlus,
  RefreshCcw,
  Trash2,
  XCircle,
} from 'lucide-react';
import Header from '../components/layout/Header';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { Mission, MissionStatus } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';

const STATUS: Record<MissionStatus, { label: string; tone: string }> = {
  PENDING: { label: '시작 전', tone: 'bg-slate-100 text-slate-600' },
  IN_PROGRESS: { label: '진행 중', tone: 'bg-blue-50 text-blue-700' },
  REVIEWING: { label: '승인 대기', tone: 'bg-amber-50 text-amber-700' },
  SUCCESS: { label: '완료', tone: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: '수정 필요', tone: 'bg-rose-50 text-rose-700' },
  FAILED: { label: '미제출', tone: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: '미제출', tone: 'bg-rose-50 text-rose-700' },
};

function missionActivityTime(mission: Mission, submittedAt?: string) {
  return new Date(submittedAt ?? mission.createdAt).getTime();
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { users, currentUser, teacherNotes, addTeacherNote, deleteTeacherNote } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs, approveMission, rejectMission, getLatestSubmission } = useMissionStore();
  const [noteInput, setNoteInput] = useState('');
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const student = users.find((user) => user.id === id);
  if (!student) return <div className="page-container"><Header title="학생 정보" showBack /><main className="content-area flex items-center justify-center px-6 text-center text-sm font-bold text-slate-400">학생을 찾을 수 없습니다.</main></div>;

  const period = params.get('period') ?? '30';
  const cutoff = period === 'all' ? null : (() => { const date = new Date(); date.setDate(date.getDate() - Number(period || 30) + 1); date.setHours(0, 0, 0, 0); return date; })();
  const allMissions = missions.filter((mission) => mission.assigneeId === student.id && (!currentUser || mission.creatorId === currentUser.id));
  const periodMissions = allMissions.filter((mission) => !cutoff || new Date(mission.createdAt) >= cutoff || new Date(mission.endDate) >= cutoff);
  const groupName = groups.find((group) => group.id === student.groupId)?.name ?? '반 미지정';
  const pending = periodMissions.filter((mission) => mission.status === 'REVIEWING');
  const active = periodMissions.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REJECTED'].includes(mission.status));
  const completed = periodMissions.filter((mission) => mission.status === 'SUCCESS');
  const missing = periodMissions.filter((mission) => ['FAILED', 'EXPIRED'].includes(mission.status));
  const myNotes = teacherNotes[student.id] ?? [];

  const recent = useMemo(() => periodMissions.map((mission) => {
    const submission = [...submissions].filter((item) => item.missionId === mission.id).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    const review = [...reviewLogs].filter((item) => item.missionId === mission.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    return { mission, submission, review, time: Math.max(missionActivityTime(mission, submission?.submittedAt), review ? new Date(review.createdAt).getTime() : 0) };
  }).sort((a, b) => b.time - a.time).slice(0, 6), [periodMissions, submissions, reviewLogs]);

  const saveNote = () => {
    if (!noteInput.trim()) return;
    addTeacherNote(student.id, noteInput);
    setNoteInput('');
  };

  return <div className="page-container bg-slate-50">
    <Header title="학생 상세" showBack showPoints={false} />
    <main className="content-area space-y-4 px-4 py-4">
      <section className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 p-5 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-4xl">{student.profileImage ? <img src={student.profileImage} alt={`${student.name} 프로필`} className="h-full w-full object-cover" /> : student.avatar}</div>
          <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black">{student.name}</h1><p className="mt-1 text-xs font-bold text-white/60">{groupName} · 최근 {period === 'all' ? '전체' : `${period}일`} 활동</p><p className="mt-1 text-[11px] text-white/45">등록 {formatDate(student.createdAt)}</p></div>
          <button onClick={() => navigate(`/students/${student.id}/report`)} className="min-h-11 shrink-0 rounded-xl bg-white px-3 text-xs font-black text-emerald-700">리포트</button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-1.5 text-center">
          {[[active.length, '진행'], [pending.length, '승인 대기'], [missing.length, '미제출'], [completed.length, '완료']].map(([value, label]) => <div key={label as string} className="rounded-xl bg-white/10 px-1 py-2"><strong className="block text-base">{value}</strong><span className="text-[9px] font-bold text-white/60">{label}</span></div>)}
        </div>
      </section>

      {pending.length > 0 && <section className="rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><ClipboardCheck size={17} className="text-amber-600"/><h2 className="font-black text-slate-800">승인 대기 제출물</h2><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">{pending.length}</span></div>
        <div className="space-y-3">{pending.map((mission) => { const submission = getLatestSubmission(mission.id); return <article key={mission.id} className="rounded-2xl bg-amber-50/70 p-3">
          <div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-black text-slate-800">{mission.title}</h3><p className="mt-1 text-[11px] font-bold text-slate-400">{submission ? `${formatDateTime(submission.submittedAt)} · ${submission.attemptNumber}회차 제출` : '제출 기록 확인 필요'}</p></div><button onClick={() => navigate(`/missions/${mission.id}`)} className="min-h-10 rounded-xl px-2 text-xs font-black text-purple-600">상세</button></div>
          {submission?.message && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs leading-relaxed text-slate-600">{submission.message}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => currentUser && approveMission(mission.id, currentUser.id)} className="min-h-11 rounded-xl bg-emerald-600 text-xs font-black text-white">승인</button><button onClick={() => currentUser && rejectMission(mission.id, currentUser.id, rejectReason[mission.id]?.trim() || '내용을 보완해 다시 제출해 주세요.')} className="min-h-11 rounded-xl bg-rose-100 text-xs font-black text-rose-700">반려</button></div>
          <input value={rejectReason[mission.id] ?? ''} onChange={(event) => setRejectReason((prev) => ({ ...prev, [mission.id]: event.target.value }))} placeholder="반려 시 전달할 안내 (선택)" className="mt-2 min-h-11 w-full rounded-xl border border-amber-100 bg-white px-3 text-xs outline-none focus:border-purple-300"/>
        </article>; })}</div>
      </section>}

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><CalendarClock size={17} className="text-purple-600"/><h2 className="font-black text-slate-800">최근 활동</h2></div><button onClick={() => navigate(`/students?period=${period}`)} className="min-h-10 text-xs font-black text-purple-600">학생 목록</button></div>
        {recent.length === 0 ? <p className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-400">선택 기간에 활동 기록이 없습니다.</p> : <div className="space-y-2">{recent.map(({ mission, submission, review }) => <button key={mission.id} onClick={() => navigate(`/missions/${mission.id}`)} className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-slate-50 p-3 text-left">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${STATUS[mission.status].tone}`}>{mission.status === 'SUCCESS' ? <CheckCircle2 size={18}/> : mission.status === 'REJECTED' ? <RefreshCcw size={18}/> : <FileText size={18}/>}</span>
          <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-800">{mission.title}</strong><span className="mt-0.5 block truncate text-[11px] font-bold text-slate-400">{review?.reason || submission?.message || mission.description || '활동 기록'}</span></span>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black ${STATUS[mission.status].tone}`}>{STATUS[mission.status].label}</span>
        </button>)}</div>}
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2"><MessageSquarePlus size={17} className="text-purple-600"/><h2 className="font-black text-slate-800">상담 메모</h2></div>
        <div className="flex gap-2"><input value={noteInput} onChange={(event) => setNoteInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && saveNote()} placeholder="상담 내용이나 특이사항 입력" maxLength={200} className="min-h-11 min-w-0 flex-1 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-purple-200"/><button onClick={saveNote} disabled={!noteInput.trim()} className="min-h-11 rounded-xl bg-purple-600 px-4 text-xs font-black text-white disabled:opacity-40">저장</button></div>
        <div className="mt-3 space-y-2">{myNotes.length === 0 ? <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-xs font-bold text-slate-400">아직 상담 메모가 없습니다.</p> : myNotes.map((note) => <div key={note.id} className="flex items-start gap-2 rounded-xl bg-purple-50 p-3"><p className="flex-1 text-sm leading-relaxed text-slate-700">{note.text}</p><div className="shrink-0 text-right"><p className="text-[9px] font-bold text-slate-400">{formatDate(note.createdAt)}</p><button onClick={() => deleteTeacherNote(student.id, note.id)} aria-label="메모 삭제" className="mt-1 min-h-8 min-w-8 text-slate-300"><Trash2 size={13} className="ml-auto"/></button></div></div>)}</div>
      </section>

      <section className="rounded-3xl border border-indigo-100 bg-indigo-50 p-4">
        <h2 className="font-black text-indigo-900">관리 메모</h2>
        <p className="mt-2 text-sm leading-relaxed text-indigo-800">{missing.length > 0 ? `${missing.length}건의 미제출 미션부터 확인해 주세요.` : pending.length > 0 ? `${pending.length}건의 제출물이 검토를 기다리고 있습니다.` : active.length > 0 ? `${active.length}건의 진행 중 미션을 이어가고 있습니다.` : completed.length > 0 ? `최근 ${completed.length}건의 미션을 완료했습니다.` : '선택 기간에 배정된 미션이 없습니다.'}</p>
      </section>

      <button onClick={() => navigate(`/students/${student.id}/report`)} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-black text-white shadow-md"><FileText size={18}/>학부모 활동 리포트 보기<ChevronRight size={17}/></button>
    </main>
  </div>;
}
