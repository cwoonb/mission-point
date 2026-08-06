import { useState } from 'react';
import { ChevronRight, FileText, NotebookPen, Trash2 } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import SegmentTabs from '../components/ui/SegmentTabs';
import { useAuthStore } from '../store/authStore';
import { useGroupStore } from '../store/groupStore';
import { useMissionStore } from '../store/missionStore';
import type { MissionStatus } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';
import { getActiveDemoScenario } from '../data/demoSession';
import { calculateClassStats } from '../utils/missionStats';
import { useMembershipStore } from '../store/membershipStore';
import GuardianManagementSection from '../components/guardian/GuardianManagementSection';
import { isStudentInOrganization } from '../utils/membershipAccess';
import { missionInOrganization } from '../utils/membershipScope';

type DetailTab = 'overview' | 'missions' | 'feedback' | 'report' | 'guardian' | 'memo';
const TABS = [
  { key: 'overview' as const, label: '개요' }, { key: 'missions' as const, label: '미션' },
  { key: 'feedback' as const, label: '피드백' }, { key: 'report' as const, label: '리포트' }, { key: 'guardian' as const, label: '보호자' }, { key: 'memo' as const, label: '메모' },
];
const STATUS: Record<MissionStatus, { label: string; tone: string }> = {
  PENDING: { label: '시작 전', tone: 'bg-[#F0F1F2] text-[#707782]' }, IN_PROGRESS: { label: '진행 중', tone: 'bg-[#EAF0F6] text-[#536D8B]' },
  REVIEWING: { label: '승인 대기', tone: 'bg-[#F8EFE3] text-[#A66D32]' }, SUCCESS: { label: '제출 완료', tone: 'bg-[#EAF2EC] text-[#52775E]' },
  REJECTED: { label: '수정 필요', tone: 'bg-[#F7ECEA] text-[#A65F59]' }, FAILED: { label: '미제출', tone: 'bg-[#F7ECEA] text-[#A65F59]' }, EXPIRED: { label: '미제출', tone: 'bg-[#F7ECEA] text-[#A65F59]' },
};

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 1) return '방금 전'; if (minutes < 60) return `${minutes}분 전`; if (minutes < 1440) return `${Math.floor(minutes / 60)}시간 전`; return `${Math.floor(minutes / 1440)}일 전`;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { users, currentUser, teacherNotes, addTeacherNote, deleteTeacherNote } = useAuthStore();
  const groups = useGroupStore((state) => state.groups);
  const { missions, submissions, reviewLogs } = useMissionStore();
  const memberships = useMembershipStore((state)=>state.memberships);
  const activeMembershipId = useMembershipStore((state)=>state.activeMembershipId);
  const activeOrganizationId = memberships.find((item)=>item.id===activeMembershipId)?.organizationId;
  const [noteInput, setNoteInput] = useState('');
  const student = users.find((user) => user.id === id && isStudentInOrganization(memberships, user.id, activeOrganizationId));
  const scenario = currentUser?.id.startsWith('demo-') ? getActiveDemoScenario() : null;
  const memberLabel = scenario?.memberLabel ?? '학생';
  if (!student) return <div className="page-container"><Header title={`${memberLabel} 정보`} showBack/><main className="content-area p-4"><EmptyState title={`${memberLabel}을 찾을 수 없습니다.`}/></main></div>;

  const tab = (TABS.some((item) => item.key === params.get('tab')) ? params.get('tab') : 'overview') as DetailTab;
  const period = params.get('period') ?? '30';
  const cutoff = period === 'all' ? null : (() => { const date = new Date(); date.setDate(date.getDate() - Number(period || 30) + 1); return date; })();
  const all = missions.filter((mission) => mission.assigneeId === student.id && (!currentUser || mission.creatorId === currentUser.id) && missionInOrganization(mission, activeOrganizationId));
  const periodMissions = all.filter((mission) => !cutoff || new Date(mission.createdAt) >= cutoff || new Date(mission.endDate) >= cutoff);
  const active = periodMissions.filter((mission) => ['PENDING', 'IN_PROGRESS', 'REJECTED'].includes(mission.status));
  const pending = periodMissions.filter((mission) => mission.status === 'REVIEWING');
  const completed = periodMissions.filter((mission) => mission.status === 'SUCCESS');
  const periodStats = calculateClassStats(periodMissions);
  const groupName = groups.find((group) => group.id === student.groupId && group.organizationId === activeOrganizationId)?.name.replace(/^[^\p{L}\p{N}]+/u, '').trim() ?? '반 미지정';
  const myMissionIds = new Set(all.map((mission) => mission.id));
  const recent = periodMissions.map((mission) => {
    const submission = submissions.filter((item) => item.missionId === mission.id).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0];
    const review = reviewLogs.filter((item) => item.missionId === mission.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const time = Math.max(new Date(submission?.submittedAt ?? mission.createdAt).getTime(), new Date(review?.createdAt ?? 0).getTime());
    return { mission, submission, review, time };
  }).sort((a, b) => b.time - a.time);
  const feedback = reviewLogs.filter((log) => myMissionIds.has(log.missionId) && (log.reason || log.publicFeedback)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const notes = (teacherNotes[student.id] ?? []).filter((note) => !note.organizationId || note.organizationId === activeOrganizationId);
  const currentStatus = periodStats.pending > 0 ? '승인 대기' : periodStats.missing > 0 ? '미제출' : periodStats.completed > 0 ? '제출 완료' : periodStats.inProgress > 0 ? '진행 중' : '활동 없음';
  const statusTone = periodStats.pending > 0 ? STATUS.REVIEWING.tone : periodStats.missing > 0 ? 'bg-[#F7ECEA] text-[#A65F59]' : periodStats.completed > 0 ? STATUS.SUCCESS.tone : periodStats.inProgress > 0 ? STATUS.IN_PROGRESS.tone : STATUS.PENDING.tone;
  const setTab = (nextTab: DetailTab) => { const next = new URLSearchParams(params); next.set('tab', nextTab); setParams(next, { replace: true }); };
  const saveNote = () => { if (!noteInput.trim()) return; void addTeacherNote(student.id, noteInput.trim(), activeOrganizationId); setNoteInput(''); };

  return <div className="page-container bg-[#F8F5F0]">
    <Header title="" showBack showPoints={false} />
    <main className="content-area">
      <section className="flex items-center gap-3 px-4 pb-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9EDF2] text-lg font-semibold text-[#14233B]">{student.profileImage ? <img src={student.profileImage} alt={`${student.name} 프로필`} className="h-full w-full object-cover"/> : student.name.slice(0,1)}</span>
        <div className="min-w-0 flex-1"><h1 className="truncate text-xl font-semibold text-[#14233B]">{student.name}</h1><p className="mt-1 text-xs text-[#737B86]">{groupName} · 등록 {formatDate(student.createdAt)}</p><span className={`mt-2 inline-block rounded-[7px] px-2 py-1 text-[10px] font-semibold ${statusTone}`}>{currentStatus}</span></div>
      </section>
      <div className="border-b border-[var(--color-border)] px-4 pb-2"><SegmentTabs tabs={TABS} value={tab} onChange={setTab} ariaLabel="학생 상세"/></div>

      <div className="space-y-6 px-4 py-4">
        {tab === 'overview' && <>
          <section><h2 className="mb-3 text-[17px] font-semibold text-[#14233B]">요약</h2><div className="grid grid-cols-3 gap-2">{[[active.length,'진행 중'],[pending.length,'승인 대기'],[completed.length,'최근 완료']].map(([value,label])=><div key={label as string} className="rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] p-3"><strong className="text-xl font-semibold text-[#14233B]">{value}</strong><p className="mt-1 text-[10px] text-[#737B86]">{label} 건</p></div>)}</div></section>
          <section><div className="mb-2 flex items-center justify-between"><h2 className="text-[17px] font-semibold text-[#14233B]">최근 활동</h2><button onClick={()=>setTab('missions')} className="min-h-10 px-1 text-xs font-semibold text-[#536D8B]">더보기 <ChevronRight size={13} className="inline"/></button></div>{recent.length ? <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[#FFFDFC]">{recent.slice(0,3).map(({mission,time})=><button key={mission.id} onClick={()=>navigate(mission.status==='REVIEWING'?`/missions/${mission.id}/review`:`/missions/${mission.id}`)} className="flex min-h-14 w-full items-center justify-between gap-3 px-3 text-left"><span className="truncate text-sm text-[#27313F]">{mission.title} {mission.status==='REVIEWING'?'제출':'활동'}</span><span className="shrink-0 text-[10px] text-[#9A9FA7]">{relativeTime(new Date(time).toISOString())}</span></button>)}</div>:<EmptyState title="선택한 기간에 기록된 활동이 없습니다." description="다른 기간을 선택해 확인해보세요."/>}</section>
          <section><div className="mb-2 flex items-center justify-between"><h2 className="text-[17px] font-semibold text-[#14233B]">최근 피드백</h2><button onClick={()=>setTab('feedback')} className="min-h-10 px-1 text-xs font-semibold text-[#536D8B]">더보기 <ChevronRight size={13} className="inline"/></button></div>{feedback.length ? <div className="rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] p-3"><p className="whitespace-pre-line text-sm leading-6 text-[#53606F]">{feedback.slice(0,2).map((item)=>item.reason).join('\n')}</p></div>:<EmptyState title="최근 전달된 피드백이 없습니다."/>}</section>
        </>}

        {tab === 'missions' && <section className="space-y-2">{periodMissions.map((mission)=><button key={mission.id} onClick={()=>navigate(mission.status==='REVIEWING'?`/missions/${mission.id}/review`:`/missions/${mission.id}`)} className="flex min-h-16 w-full items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] px-3 text-left"><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold text-[#27313F]">{mission.title}</strong><span className="mt-1 block text-[11px] text-[#737B86]">마감 {formatDate(mission.endDate)}</span></span><span className={`rounded-[7px] px-2 py-1 text-[10px] font-semibold ${STATUS[mission.status].tone}`}>{STATUS[mission.status].label}</span></button>)}{periodMissions.length===0&&<EmptyState title="선택한 기간에 배정된 미션이 없습니다." description="최근 활동 기록은 개요에서 확인할 수 있습니다."/>}</section>}

        {tab === 'feedback' && <section className="space-y-2">{feedback.map((log)=>{const mission=all.find((item)=>item.id===log.missionId);return <article key={log.id} className="rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] p-4"><div className="flex items-center justify-between gap-2"><strong className="truncate text-sm font-semibold text-[#14233B]">{mission?.title??'미션'}</strong><span className="text-[10px] text-[#9A9FA7]">{formatDateTime(log.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-[#53606F]">{log.action==='REJECTED'?log.reason:log.publicFeedback}</p></article>;})}{feedback.length===0&&<EmptyState title="최근 전달된 피드백이 없습니다."/>}</section>}

        {tab === 'report' && <section className="rounded-2xl border border-[var(--color-border)] bg-[#FFFDFC] p-5 text-center"><FileText size={28} className="mx-auto text-[#B58A4A]"/><h2 className="mt-3 text-lg font-semibold text-[#14233B]">학부모 활동 리포트</h2><p className="mt-2 text-sm leading-6 text-[#737B86]">최근 활동과 피드백을 읽기 쉬운 기록으로 확인하고 공유합니다.</p><button onClick={()=>navigate(`/students/${student.id}/report`)} className="mt-5 min-h-12 w-full rounded-[10px] bg-[#14233B] text-sm font-semibold text-white">리포트 보기</button></section>}

        {tab === 'guardian' && activeOrganizationId && <GuardianManagementSection organizationId={activeOrganizationId} studentId={student.id} studentName={student.name}/>}

        {tab === 'memo' && <section><h2 className="mb-3 text-[17px] font-semibold text-[#14233B]">상담 메모</h2><div className="flex gap-2"><input value={noteInput} onChange={(event)=>setNoteInput(event.target.value)} onKeyDown={(event)=>event.key==='Enter'&&saveNote()} placeholder="상담 내용이나 특이사항 입력" maxLength={200} className="min-h-12 min-w-0 flex-1 rounded-[10px] border border-[var(--color-border)] bg-[#FFFDFC] px-3 text-sm"/><button onClick={saveNote} disabled={!noteInput.trim()} className="min-h-12 rounded-[10px] bg-[#14233B] px-4 text-sm font-semibold text-white disabled:opacity-40">저장</button></div><div className="mt-3 space-y-2">{notes.map((note)=><article key={note.id} className="flex gap-2 rounded-xl border border-[var(--color-border)] bg-[#FFFDFC] p-3"><NotebookPen size={16} className="mt-0.5 shrink-0 text-[#B58A4A]"/><p className="flex-1 text-sm leading-6 text-[#53606F]">{note.text}</p><div className="shrink-0 text-right"><p className="text-[10px] text-[#9A9FA7]">{formatDate(note.createdAt)}</p><button onClick={()=>deleteTeacherNote(student.id,note.id)} aria-label="메모 삭제" className="mt-1 flex h-9 w-9 items-center justify-end text-[#9A9FA7]"><Trash2 size={14}/></button></div></article>)}{notes.length===0&&<EmptyState title="아직 작성된 상담 메모가 없습니다."/>}</div></section>}
      </div>
    </main>
  </div>;
}
